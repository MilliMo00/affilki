import { db } from "@/lib/db";
import type { TelegramApi, TgUser } from "@/lib/telegram/client";
import { CHECK_MESSAGES, checkAccount } from "./checks";
import { randomToken, sha256 } from "./tokens";

export const LOGIN_TTL_MS = 10 * 60 * 1000;
// Вход бессрочный: сессия в базе живёт 10 лет, пока её не отозвали (выход или бан).
export const SESSION_TTL_MS = 10 * 365 * 24 * 60 * 60 * 1000;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://affilki.com";
const CHANNEL_URL = process.env.TG_CHANNEL_URL ?? "https://t.me/affilki_cpa";

type Fingerprint = { ipHash: string; uaHash: string; uaLabel: string };

/** Шаг 1 (сайт): создаёт одноразовую ссылку входа. Секрет остаётся в cookie браузера. */
export async function startLogin(fp: Fingerprint, now = new Date()) {
  const token = randomToken();
  const browserSecret = randomToken();
  await db.loginIntent.create({
    data: { token, browserHash: sha256(browserSecret), ...fp, expiresAt: new Date(now.getTime() + LOGIN_TTL_MS) },
  });
  return { token, browserSecret, expiresAt: new Date(now.getTime() + LOGIN_TTL_MS) };
}

const confirmButtons = (intentId: string) => [
  [{ text: "Подтвердить вход", callback_data: `ok:${intentId}` }],
  [{ text: "Это не я", callback_data: `no:${intentId}` }],
];

/** Шаг 2 (бот): /start l_<token>. Привязывает ссылку к аккаунту и просит подтверждение. */
export async function handleStart(token: string, from: TgUser, tg: TelegramApi, now = new Date()) {
  const stale = "Ссылка устарела. Вернись на сайт и нажми «Голосовать» ещё раз.";
  const intent = await db.loginIntent.findUnique({ where: { token } });
  if (!intent || intent.expiresAt <= now) return tg.sendMessage(from.id, stale);

  // Ссылка одноразовая: её привязывает первый аккаунт, который её открыл.
  if (intent.status !== "PENDING" && !(intent.status === "BOUND" && intent.tgUserId === BigInt(from.id))) {
    return tg.sendMessage(from.id, stale);
  }

  const hasAvatar = await tg.hasProfilePhoto(from.id);
  const bound = await db.loginIntent.updateMany({
    where: { id: intent.id, status: intent.status },
    data: {
      status: "BOUND",
      tgUserId: BigInt(from.id),
      tgUsername: from.username ?? null,
      tgFirstName: from.first_name ?? null,
      hasAvatar,
    },
  });
  if (bound.count === 0) return tg.sendMessage(from.id, stale);

  await tg.sendMessage(
    from.id,
    `Вход на affilki.com\n\nБраузер: ${intent.uaLabel}\n\nЕсли это ты нажал «Голосовать» на сайте — подтверди. Если ссылку прислал кто-то другой, нажми «Это не я»: с твоего аккаунта никто не проголосует.`,
    confirmButtons(intent.id),
  );
}

/** Шаг 3 (бот): кнопки «Подтвердить вход» / «Это не я». Отвечает текстом для сообщения. */
export async function handleDecision(
  action: "ok" | "no",
  intentId: string,
  from: TgUser,
  tg: Pick<TelegramApi, "isChannelMember">,
  now = new Date(),
): Promise<{ text: string; buttons?: { text: string; url?: string; callback_data?: string }[][] }> {
  const intent = await db.loginIntent.findUnique({ where: { id: intentId } });
  // Чужую ссылку подтвердить нельзя: решает только аккаунт, к которому она привязана.
  if (!intent || intent.status !== "BOUND" || intent.tgUserId !== BigInt(from.id) || intent.expiresAt <= now) {
    return { text: "Ссылка устарела. Вернись на сайт и нажми «Голосовать» ещё раз." };
  }

  if (action === "no") {
    await db.loginIntent.update({ where: { id: intent.id }, data: { status: "REJECTED" } });
    return { text: "Вход отменён. С твоего аккаунта никто не вошёл." };
  }

  await db.loginIntent.update({ where: { id: intent.id }, data: { status: "CONFIRMED" } });

  // Вход работает всегда; пороги проверяются при каждом голосе. Здесь — только подсказка заранее.
  const season = await db.season.findFirst({ orderBy: { year: "desc" } });
  const failure = season
    ? await checkAccount({ tgUserId: BigInt(from.id), username: from.username ?? null, hasAvatar: intent.hasAvatar }, season, tg)
    : null;
  if (failure) {
    return {
      text: `Вход подтверждён. Вернись на сайт.\n\n${CHECK_MESSAGES[failure]}`,
      buttons: failure === "not_subscribed" ? [[{ text: "Подписаться на канал", url: CHANNEL_URL }]] : undefined,
    };
  }
  return { text: "Вход подтверждён. Вернись на сайт — голос ждёт подтверждения там.", buttons: [[{ text: "Открыть сайт", url: `${SITE}/awards` }]] };
}

export type ClaimResult =
  | { status: "pending" | "expired" | "rejected" }
  | { status: "ok"; sessionToken: string; expiresAt: Date };

/** Шаг 4 (сайт): браузер с секретом забирает сессию, когда вход подтверждён в боте. */
export async function claimSession(browserSecret: string, now = new Date()): Promise<ClaimResult> {
  const intent = await db.loginIntent.findFirst({
    where: { browserHash: sha256(browserSecret) },
    orderBy: { createdAt: "desc" },
  });
  if (!intent || intent.status === "USED") return { status: "expired" };
  if (intent.status === "REJECTED") return { status: "rejected" };
  if (intent.expiresAt <= now) return { status: "expired" };
  if (intent.status !== "CONFIRMED" || intent.tgUserId === null) return { status: "pending" };

  // Сессию по одной ссылке можно получить ровно один раз.
  const used = await db.loginIntent.updateMany({ where: { id: intent.id, status: "CONFIRMED" }, data: { status: "USED" } });
  if (used.count === 0) return { status: "expired" };

  const sessionToken = randomToken();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  await db.voterSession.create({
    data: {
      id: sha256(sessionToken),
      tgUserId: intent.tgUserId,
      tgUsername: intent.tgUsername,
      tgFirstName: intent.tgFirstName,
      hasAvatar: intent.hasAvatar,
      ipHash: intent.ipHash,
      uaHash: intent.uaHash,
      expiresAt,
    },
  });
  return { status: "ok", sessionToken, expiresAt };
}

/** Действующая сессия по токену из cookie. */
export async function findSession(sessionToken: string | undefined, now = new Date()) {
  if (!sessionToken) return null;
  const session = await db.voterSession.findUnique({ where: { id: sha256(sessionToken) } });
  if (!session || session.revokedAt || session.expiresAt <= now) return null;
  return session;
}
