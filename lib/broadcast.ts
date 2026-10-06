import type { Broadcast } from "@prisma/client";
import { db } from "@/lib/db";
import { readUpload } from "@/lib/storage";

// Рассылки через бота. Бот может писать только тем, кто сам ему писал (таблица BotUser).
// Отправка идёт в фоне и возобновляется по таблице получателей: никто не получит сообщение дважды.

// ── Форматирование ─────────────────────────────────────────────────────────

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Простая разметка → HTML, который понимает Telegram.
 * **жирный**, *курсив*, __подчёркнутый__, `код`, [текст](https://ссылка). Всё остальное экранируется.
 */
export function toTelegramHtml(source: string) {
  return escapeHtml(source.replace(/\r\n?/g, "\n").trim())
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>")
    .replace(/__([^_\n]+)__/g, "<u>$1</u>")
    .replace(/\*([^*\n]+)\*/g, "<i>$1</i>")
    .replace(/\[([^\]\n]+)\]\((https:\/\/[^\s)"<>]+)\)/g, '<a href="$2">$1</a>');
}

/** Длина текста так, как её считает Telegram: без тегов. С картинкой лимит 1024, без неё — 4096. */
export const visibleLength = (html: string) => html.replace(/<[^>]+>/g, "").length;
export const textLimit = (withImage: boolean) => (withImage ? 1024 : 4096);

// ── Аудитория ──────────────────────────────────────────────────────────────

export const SEGMENTS = {
  all: "Все подписчики бота",
  voters: "Уже проголосовали",
  not_voted: "Вошли, но ещё не голосовали",
  authors: "Авторы заявок",
} as const;
export type Segment = keyof typeof SEGMENTS;

/** Telegram ID получателей сегмента: только те, кто не заблокировал бота и не отписался. */
export async function audience(segment: Segment): Promise<bigint[]> {
  const reachable = await db.botUser.findMany({ where: { blockedAt: null, unsubscribedAt: null }, select: { tgUserId: true } });
  const ids = reachable.map((user) => user.tgUserId);
  if (segment === "all" || ids.length === 0) return ids;

  const distinct = async (rows: Promise<{ tgUserId: bigint }[]>) => new Set((await rows).map((row) => row.tgUserId));
  if (segment === "authors") {
    const authors = await distinct(db.submission.findMany({ where: { tgUserId: { in: ids } }, select: { tgUserId: true }, distinct: ["tgUserId"] }));
    return ids.filter((id) => authors.has(id));
  }
  const voted = await distinct(db.vote.findMany({ where: { tgUserId: { in: ids }, voidedAt: null }, select: { tgUserId: true }, distinct: ["tgUserId"] }));
  if (segment === "voters") return ids.filter((id) => voted.has(id));
  // «Вошли, но не голосовали»: есть сессия на сайте, голосов нет.
  const loggedIn = await distinct(db.voterSession.findMany({ where: { tgUserId: { in: ids }, revokedAt: null }, select: { tgUserId: true }, distinct: ["tgUserId"] }));
  return ids.filter((id) => loggedIn.has(id) && !voted.has(id));
}

export async function audienceCounts() {
  const [segments, total, blocked, unsubscribed] = await Promise.all([
    Promise.all((Object.keys(SEGMENTS) as Segment[]).map(async (key) => [key, (await audience(key)).length] as const)),
    db.botUser.count(),
    db.botUser.count({ where: { blockedAt: { not: null } } }),
    db.botUser.count({ where: { unsubscribedAt: { not: null }, blockedAt: null } }),
  ]);
  return { segments: Object.fromEntries(segments) as Record<Segment, number>, total, blocked, unsubscribed };
}

// ── Отправка ───────────────────────────────────────────────────────────────

export type SendResult = { ok: true; fileId?: string } | { ok: false; reason: "blocked" | "error"; error: string; retryAfter?: number };

type Message = Pick<Broadcast, "text" | "imageUrl" | "photoFileId" | "buttonText" | "buttonUrl">;

/** Отправка одного сообщения одному человеку. Вынесена в тип, чтобы в тестах подставлять заглушку. */
export type Sender = (chatId: bigint, message: Message, withUnsubscribe: boolean) => Promise<SendResult>;

const fakeBot = () => process.env.NODE_ENV !== "production" && process.env.DEV_FAKE_BOT === "true";

export const telegramSender: Sender = async (chatId, message, withUnsubscribe) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, reason: "error", error: "нет токена бота" };
  // Локальная разработка: настоящим людям ничего не уходит.
  if (fakeBot()) return { ok: true, fileId: "fake" };

  const html = toTelegramHtml(message.text);
  const keyboard = [
    ...(message.buttonText && message.buttonUrl ? [[{ text: message.buttonText, url: message.buttonUrl }]] : []),
    ...(withUnsubscribe ? [[{ text: "Отписаться от рассылки", callback_data: "unsub" }]] : []),
  ];
  const markup = keyboard.length > 0 ? { inline_keyboard: keyboard } : undefined;

  let response: Response;
  try {
    if (!message.imageUrl) {
      response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId.toString(), text: html, parse_mode: "HTML", reply_markup: markup }),
        signal: AbortSignal.timeout(20_000),
      });
    } else {
      const form = new FormData();
      form.set("chat_id", chatId.toString());
      form.set("caption", html);
      form.set("parse_mode", "HTML");
      if (markup) form.set("reply_markup", JSON.stringify(markup));
      if (message.photoFileId) {
        form.set("photo", message.photoFileId);
      } else {
        // Первая отправка: загружаем сам файл. Дальше Telegram отдаёт file_id, и файл больше не грузится.
        const file = await readUpload(message.imageUrl.replace("/uploads/", ""));
        if (!file) return { ok: false, reason: "error", error: "картинка не найдена" };
        form.set("photo", new Blob([new Uint8Array(file.bytes)], { type: file.mime }), "image");
      }
      response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: "POST", body: form, signal: AbortSignal.timeout(60_000) });
    }
  } catch (error) {
    return { ok: false, reason: "error", error: String(error).slice(0, 200) };
  }

  const body = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    description?: string;
    error_code?: number;
    parameters?: { retry_after?: number };
    result?: { photo?: { file_id: string }[] };
  };
  if (body.ok) return { ok: true, fileId: body.result?.photo?.at(-1)?.file_id };
  // 403 — человек заблокировал бота или удалил аккаунт.
  if (body.error_code === 403) return { ok: false, reason: "blocked", error: body.description ?? "403" };
  return { ok: false, reason: "error", error: body.description ?? `HTTP ${response.status}`, retryAfter: body.parameters?.retry_after };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Рассылки, которые этот процесс отправляет прямо сейчас.
const globalForBroadcast = globalThis as unknown as { broadcastsRunning?: Set<string> };
const running = (globalForBroadcast.broadcastsRunning ??= new Set<string>());

export const isRunning = (id: string) => running.has(id);

/** Создаёт рассылку и список получателей. Сама отправка запускается отдельно через runBroadcast. */
export async function createBroadcast(input: Omit<Message, "photoFileId"> & { segment: Segment; createdBy: string }) {
  const ids = await audience(input.segment);
  return db.broadcast.create({
    data: { ...input, total: ids.length, recipients: { createMany: { data: ids.map((tgUserId) => ({ tgUserId })) } } },
  });
}

/**
 * Отправляет рассылку: берёт получателей в статусе PENDING пачками и помечает каждого.
 * Около 20 сообщений в секунду — с запасом ниже лимита Telegram. Можно вызывать повторно:
 * после перезапуска сервера отправка продолжится с того места, где остановилась.
 */
export async function runBroadcast(id: string, send: Sender = telegramSender, pauseMs = 50) {
  if (running.has(id)) return;
  running.add(id);
  try {
    for (;;) {
      const broadcast = await db.broadcast.findUnique({ where: { id } });
      if (!broadcast || broadcast.status !== "SENDING") return;

      const batch = await db.broadcastRecipient.findMany({ where: { broadcastId: id, status: "PENDING" }, take: 25 });
      if (batch.length === 0) {
        await db.broadcast.update({ where: { id }, data: { status: "DONE", finishedAt: new Date() } });
        return;
      }

      let fileId = broadcast.photoFileId;
      for (const recipient of batch) {
        let result = await send(recipient.tgUserId, { ...broadcast, photoFileId: fileId }, true);
        // Telegram просит подождать — ждём и пробуем этого же получателя ещё раз.
        if (!result.ok && result.retryAfter) {
          await sleep(Math.min(result.retryAfter, 60) * 1000);
          result = await send(recipient.tgUserId, { ...broadcast, photoFileId: fileId }, true);
        }

        if (result.ok) {
          if (result.fileId && !fileId) {
            fileId = result.fileId;
            await db.broadcast.update({ where: { id }, data: { photoFileId: fileId } });
          }
          await db.broadcastRecipient.update({ where: { id: recipient.id }, data: { status: "SENT" } });
          await db.broadcast.update({ where: { id }, data: { sent: { increment: 1 } } });
        } else if (result.reason === "blocked") {
          await db.broadcastRecipient.update({ where: { id: recipient.id }, data: { status: "BLOCKED", error: result.error } });
          await db.broadcast.update({ where: { id }, data: { blocked: { increment: 1 } } });
          await db.botUser.updateMany({ where: { tgUserId: recipient.tgUserId }, data: { blockedAt: new Date() } });
        } else {
          await db.broadcastRecipient.update({ where: { id: recipient.id }, data: { status: "FAILED", error: result.error } });
          await db.broadcast.update({ where: { id }, data: { failed: { increment: 1 } } });
        }
        if (pauseMs > 0) await sleep(pauseMs);
      }
    }
  } finally {
    running.delete(id);
  }
}

// ── Подписчики бота ────────────────────────────────────────────────────────

/** Запоминает того, кто написал боту: теперь бот может ему писать. Блокировка снимается — раз человек вернулся. */
export async function rememberBotUser(from: { id: number; username?: string; first_name?: string }) {
  const data = { username: from.username ?? null, firstName: from.first_name ?? null, lastSeenAt: new Date(), blockedAt: null };
  await db.botUser.upsert({ where: { tgUserId: BigInt(from.id) }, create: { tgUserId: BigInt(from.id), ...data }, update: data });
}

export async function setSubscribed(tgUserId: number, subscribed: boolean) {
  await db.botUser.updateMany({ where: { tgUserId: BigInt(tgUserId) }, data: { unsubscribedAt: subscribed ? null : new Date() } });
}
