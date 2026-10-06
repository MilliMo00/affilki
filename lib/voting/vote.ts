import { Prisma, type VoterSession } from "@prisma/client";
import { db } from "@/lib/db";
import type { TelegramApi } from "@/lib/telegram/client";
import { CHECK_MESSAGES, checkAccount, type CheckFailure } from "./checks";

const dateFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone: "Europe/Moscow" });

export type VoteError =
  | "not_found"
  | "not_started"
  | "ended"
  | "captcha"
  | "already_voted"
  | CheckFailure;

export type VoteResult =
  | { ok: true; nomineeName: string; nominationTitle: string; remaining: number }
  | { ok: false; error: VoteError; message: string };

type Deps = {
  tg: Pick<TelegramApi, "isChannelMember" | "sendMessage"> & Partial<Pick<TelegramApi, "hasProfilePhoto" | "usernameOf">>;
  verifyCaptcha: (token: string) => Promise<boolean>;
  now?: Date;
};

type Input = { session: VoterSession; nomineeSlug: string; captchaToken: string; ipHash: string; uaHash: string };

const fail = (error: VoteError, message: string): VoteResult => ({ ok: false, error, message });

/** Запись голоса. Все проверки — на сервере и по серверному времени. */
export async function castVote(input: Input, deps: Deps): Promise<VoteResult> {
  const { nomineeSlug, captchaToken, ipHash, uaHash } = input;
  let session = input.session;
  const now = deps.now ?? new Date();

  const nominee = await db.nominee.findUnique({
    where: { slug: nomineeSlug },
    include: { nomination: { include: { season: true } } },
  });
  const nomination = nominee?.nomination;
  const visible = nominee?.published && (!nomination?.requiresLegalReview || nominee.legalChecked);
  if (!nominee || !nomination || !visible) return fail("not_found", "Участник не найден.");

  const season = nomination.season;
  // До общего старта голосовать можно только в номинации с включённым тестовым голосованием.
  if (now < season.votingStartsAt && !nomination.testVoting) return fail("not_started", `Голосование начнётся ${dateFmt.format(season.votingStartsAt)}.`);
  if (now > season.votingEndsAt) return fail("ended", `Голосование закончилось ${dateFmt.format(season.votingEndsAt)}.`);

  const existing = await db.vote.findUnique({
    where: { tgUserId_nominationId: { tgUserId: session.tgUserId, nominationId: nomination.id } },
  });
  if (existing) return fail("already_voted", "Твой голос в этой номинации уже отдан. Изменить его нельзя.");

  // Вход бессрочный, а фото и username запомнены на момент входа. Если их требуют, а в сессии их нет —
  // спрашиваем у Telegram заново: человек мог добавить их уже после входа.
  const tgId = Number(session.tgUserId);
  if (season.requireAvatar && !session.hasAvatar && (await deps.tg.hasProfilePhoto?.(tgId))) {
    session = await db.voterSession.update({ where: { id: session.id }, data: { hasAvatar: true } });
  }
  if (season.requireUsername && !session.tgUsername) {
    const username = await deps.tg.usernameOf?.(tgId);
    if (username) session = await db.voterSession.update({ where: { id: session.id }, data: { tgUsername: username } });
  }

  const failure = await checkAccount(
    { tgUserId: session.tgUserId, username: session.tgUsername, hasAvatar: session.hasAvatar },
    season,
    deps.tg,
  );
  if (failure) return fail(failure, CHECK_MESSAGES[failure]);

  if (!(await deps.verifyCaptcha(captchaToken))) return fail("captcha", "Проверка не пройдена. Попробуй ещё раз.");

  try {
    await db.vote.create({
      data: {
        tgUserId: session.tgUserId,
        tgUsername: session.tgUsername,
        hasAvatar: session.hasAvatar,
        nominationId: nomination.id,
        nomineeId: nominee.id,
        ipHash,
        uaHash,
      },
    });
  } catch (error) {
    // Два запроса одновременно: второй упирается в уникальный индекс базы.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail("already_voted", "Твой голос в этой номинации уже отдан. Изменить его нельзя.");
    }
    throw error;
  }

  const [total, voted] = await Promise.all([
    db.nomination.count({ where: { seasonId: season.id } }),
    db.vote.count({ where: { tgUserId: session.tgUserId, nomination: { seasonId: season.id } } }),
  ]);
  const remaining = Math.max(0, total - voted);

  // Квитанция в бот: если человек не голосовал, он это увидит. Сбой отправки голос не отменяет.
  void deps.tg
    .sendMessage(
      Number(session.tgUserId),
      `Голос за «${nominee.name}» в номинации «${nomination.title}» засчитан.\n\n${
        remaining > 0 ? `Осталось номинаций: ${remaining}.` : "Ты проголосовал во всех номинациях."
      }\n\nЕсли это был не ты — напиши нам.`,
      [[{ text: "Другие номинации", url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://affilki.com"}/awards` }]],
    )
    .catch(() => {});

  return { ok: true, nomineeName: nominee.name, nominationTitle: nomination.title, remaining };
}

/** Голоса пользователя в сезоне: slug номинации → slug участника. */
export async function votesOf(tgUserId: bigint) {
  const votes = await db.vote.findMany({
    where: { tgUserId },
    select: { nomination: { select: { slug: true } }, nominee: { select: { slug: true, name: true } } },
  });
  return Object.fromEntries(votes.map((v) => [v.nomination.slug, { slug: v.nominee.slug, name: v.nominee.name }]));
}
