import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { liveStatus } from "@/lib/live/snapshot";
import type { InlineButton, TelegramApi, TgUser } from "@/lib/telegram/client";
import { countedVotes } from "@/lib/voting/test-mode";

// Ссылки команд на бота. Редакция выкладывает анкету сама и отправляет менеджеру команды личную ссылку:
// t.me/<бот>?start=t_<token>. По ней бот привязывает Telegram-аккаунт к участнику и показывает
// команде её голоса и место в номинации. Ссылка многоразовая (её можно переслать коллегам);
// новая ссылка отключает старую, уже привязанные аккаунты остаются.

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://affilki.com";
export const TEAM_START = /^t_([A-Za-z0-9_-]{20,40})$/;

export const teamLink = (token: string) => `https://t.me/${process.env.TELEGRAM_BOT_USERNAME ?? "affilki_bot"}?start=t_${token}`;

/** Ссылка участника: существующая или новая (regenerate — заменить, старая перестанет работать). */
export async function ensureTeamToken(nomineeId: string, regenerate = false) {
  const nominee = await db.nominee.findUniqueOrThrow({ where: { id: nomineeId }, select: { teamToken: true } });
  if (nominee.teamToken && !regenerate) return nominee.teamToken;
  const token = randomBytes(18).toString("base64url");
  await db.nominee.update({ where: { id: nomineeId }, data: { teamToken: token } });
  return token;
}

/** Готовое сообщение менеджеру команды — его копируют в админке и отправляют в Telegram. */
export function teamMessage(nominee: { name: string; slug: string; nominationTitle: string }, token: string, votingStartsAt: Date) {
  return [
    `Привет! Ваша анкета уже на сайте AFFILKI Awards — «${nominee.name}» в номинации «${nominee.nominationTitle}»:`,
    `${SITE}/n/${nominee.slug}`,
    "",
    "Вот ваша личная ссылка на бота премии:",
    teamLink(token),
    "",
    `Откройте её — бот привяжет ваш Telegram к странице команды. С ${formatDate(votingStartsAt)}, когда стартует голосование, в боте можно будет смотреть свои голоса и место в номинации. Ссылку можно передать коллегам по команде.`,
  ].join("\n");
}

// Telegram-контакты команды: @username и ссылки t.me/<username> из анкеты. Каналы и чаты (по названию кнопки) пропускаем.
const NOT_PERSON = /канал|чат|channel|chat|блэклист|прайс|сайт|youtube|instagram/i;
export function teamContacts(contact: string | null | undefined, buttons: { title: string; url: string }[]) {
  const names = new Set<string>();
  for (const match of (contact ?? "").matchAll(/(?:@|t\.me\/)([A-Za-z][A-Za-z0-9_]{3,31})/g)) names.add(match[1]);
  for (const button of buttons) {
    const name = /^https:\/\/(?:www\.)?t\.me\/([A-Za-z][A-Za-z0-9_]{3,31})\/?$/.exec(button.url)?.[1];
    if (name && !NOT_PERSON.test(button.title)) names.add(name);
  }
  // Ботам такое сообщение писать бессмысленно.
  return [...names].filter((name) => !/bot$/i.test(name)).slice(0, 3);
}

/** Ссылка «поделиться» Telegram: открывает выбор чата с уже вписанным текстом. */
export const shareToTelegram = (message: string, token: string) =>
  `https://t.me/share/url?url=${encodeURIComponent(teamLink(token))}&text=${encodeURIComponent(message.replace(teamLink(token), "").replace(/\n{3,}/g, "\n\n").trim())}`;

const STATS_BUTTON: InlineButton = { text: "Мои голоса", callback_data: "team:stats" };

/** /start t_<token>: привязываем аккаунт к участнику. */
export async function claimTeam(token: string, from: TgUser, tg: Pick<TelegramApi, "sendMessage">) {
  const nominee = await db.nominee.findUnique({ where: { teamToken: token }, include: { nomination: { select: { title: true } } } });
  if (!nominee) {
    return tg.sendMessage(from.id, "Ссылка не действует — возможно, её заменили на новую. Попросите актуальную у редакции AFFILKI.");
  }
  await db.nomineeOwner.upsert({
    where: { nomineeId_tgUserId: { nomineeId: nominee.id, tgUserId: BigInt(from.id) } },
    create: { nomineeId: nominee.id, tgUserId: BigInt(from.id), username: from.username ?? null },
    update: { username: from.username ?? null },
  });
  return tg.sendMessage(
    from.id,
    `Готово: вы подключены к «${nominee.name}» в номинации «${nominee.nomination.title}».\n\nЗдесь можно смотреть голоса и место команды — кнопка «Мои голоса» или команда /stats. Сюда же придут новости премии.`,
    [[{ text: "Страница команды", url: `${SITE}/n/${nominee.slug}` }], [STATS_BUTTON]],
  );
}

/** Голоса и место для всех участников, к которым привязан аккаунт. */
export async function teamStatsText(tgUserId: bigint, now = new Date()): Promise<string | null> {
  const owned = await db.nomineeOwner.findMany({
    where: { tgUserId },
    include: { nominee: { include: { nomination: { include: { season: true } } } } },
  });
  if (owned.length === 0) return null;

  const banned = (await db.tgBan.findMany({ select: { tgUserId: true } })).map((ban) => ban.tgUserId);
  const parts: string[] = [];
  for (const { nominee } of owned) {
    const { nomination } = nominee;
    const season = nomination.season;
    const head = `«${nominee.name}» — ${nomination.title}`;
    if (now < season.votingStartsAt && !season.testVoting) {
      parts.push(`${head}\nГолосование начнётся ${formatDate(season.votingStartsAt)}. Голосов пока нет.`);
      continue;
    }
    const groups = await db.vote.groupBy({
      by: ["nomineeId"],
      where: { nominationId: nomination.id, voidedAt: null, tgUserId: { notIn: banned }, ...countedVotes(season, now) },
      _count: { _all: true },
    });
    const votes = groups.find((group) => group.nomineeId === nominee.id)?._count._all ?? 0;
    const status = liveStatus(season, now);
    // Место — как на live-табло: в заморозке перед финалом его не показываем никому.
    let place = "";
    if (status === "frozen") place = "\nМесто скрыто до объявления итогов — последние часы голосования идут вслепую.";
    else if (status !== "off") {
      const rank = groups.filter((group) => group._count._all > votes).length + 1;
      const total = await db.nominee.count({ where: { nominationId: nomination.id, published: true } });
      place = `\nМесто в номинации: ${rank} из ${total}.`;
    }
    parts.push(`${head}\nГолосов: ${votes}.${place}`);
  }
  return parts.join("\n\n");
}

export async function sendTeamStats(from: TgUser, tg: Pick<TelegramApi, "sendMessage">) {
  const text = await teamStatsText(BigInt(from.id));
  if (!text) return tg.sendMessage(from.id, "Ваш аккаунт не привязан ни к одной команде. Попросите у редакции AFFILKI ссылку для вашей команды.");
  return tg.sendMessage(from.id, text, [[STATS_BUTTON]]);
}
