import type { TelegramApi, TgUser } from "./client";
import { recordServerEvent } from "@/lib/analytics/record";
import { rememberBotUser, setSubscribed } from "@/lib/broadcast";
import { handleDecision, handleStart } from "@/lib/voting/login";

type Update = {
  message?: { text?: string; from?: TgUser; chat: { id: number; type: string } };
  callback_query?: { id: string; data?: string; from: TgUser; message?: { message_id: number; chat: { id: number } } };
};

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://affilki.com";

/** Обработка одного обновления от Telegram. */
export async function handleUpdate(update: Update, tg: TelegramApi) {
  const message = update.message;
  // Любой, кто написал боту или нажал кнопку, становится тем, кому бот может писать.
  const author = message?.chat.type === "private" ? message.from : update.callback_query?.from;
  if (author) await rememberBotUser(author).catch(() => {});

  if (message?.from && message.chat.type === "private" && message.text) {
    // Отписка и возврат к рассылкам. Квитанции о голосах и ответы по заявкам приходят в любом случае.
    if (/^\/stop\b/.test(message.text)) {
      await setSubscribed(message.from.id, false);
      return tg.sendMessage(message.from.id, "Рассылку отключили. Квитанции о голосах и ответы по заявкам будут приходить как раньше. Вернуть рассылку — /subscribe.");
    }
    if (/^\/subscribe\b/.test(message.text)) {
      await setSubscribed(message.from.id, true);
      return tg.sendMessage(message.from.id, "Рассылка снова включена. Отключить — /stop.");
    }

    const start = /^\/start(?:\s+l_([A-Za-z0-9_-]{16,64}))?\s*$/.exec(message.text);
    if (start?.[1]) {
      recordServerEvent(null, { type: "bot_start" });
      return handleStart(start[1], message.from, tg);
    }
    return tg.sendMessage(
      message.from.id,
      "Это бот премии AFFILKI Awards. Голосование идёт на сайте: выбери участника, нажми «Голосовать» — и подтверди вход здесь.",
      [[{ text: "Открыть премию", url: `${SITE}/awards` }]],
    );
  }

  const callback = update.callback_query;
  if (callback) {
    const match = /^(ok|no):([a-z0-9]{10,40})$/.exec(callback.data ?? "");
    if (match) {
      const reply = await handleDecision(match[1] as "ok" | "no", match[2], callback.from, tg);
      recordServerEvent(null, { type: match[1] === "ok" ? "login_confirmed" : "login_rejected" });
      if (callback.message) await tg.editMessage(callback.message.chat.id, callback.message.message_id, reply.text, reply.buttons);
    }
    await tg.answerCallback(callback.id);
  }
}
