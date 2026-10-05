// Тонкая обёртка над Telegram Bot API. Логика голосования получает её через интерфейс,
// чтобы в тестах подставлять заглушку.

export type TgUser = { id: number; username?: string; first_name?: string };

export type InlineButton = { text: string; url?: string; callback_data?: string };

export interface TelegramApi {
  sendMessage(chatId: number, text: string, buttons?: InlineButton[][]): Promise<void>;
  editMessage(chatId: number, messageId: number, text: string, buttons?: InlineButton[][]): Promise<void>;
  answerCallback(callbackId: string, text?: string): Promise<void>;
  /** Подписан ли пользователь на канал. */
  isChannelMember(userId: number): Promise<boolean>;
  hasProfilePhoto(userId: number): Promise<boolean>;
  channelMemberCount(): Promise<number | null>;
}

async function call<T>(method: string, params: Record<string, unknown>): Promise<T | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  // Локальная разработка с тестовым ботом: настоящим людям ничего не отправляем.
  if (process.env.NODE_ENV !== "production" && process.env.DEV_FAKE_BOT === "true") return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(8000),
    });
    const body = (await res.json()) as { ok: boolean; result?: T; description?: string };
    if (!body.ok) console.error(`telegram ${method}: ${body.description}`);
    return body.ok ? (body.result ?? null) : null;
  } catch (error) {
    console.error(`telegram ${method}:`, error);
    return null;
  }
}

const markup = (buttons?: InlineButton[][]) => (buttons ? { reply_markup: { inline_keyboard: buttons } } : {});

export const telegram: TelegramApi = {
  async sendMessage(chatId, text, buttons) {
    await call("sendMessage", { chat_id: chatId, text, link_preview_options: { is_disabled: true }, ...markup(buttons) });
  },
  async editMessage(chatId, messageId, text, buttons) {
    await call("editMessageText", { chat_id: chatId, message_id: messageId, text, ...markup(buttons) });
  },
  async answerCallback(callbackId, text) {
    await call("answerCallbackQuery", { callback_query_id: callbackId, text });
  },
  async isChannelMember(userId) {
    const member = await call<{ status: string }>("getChatMember", {
      chat_id: process.env.TELEGRAM_CHANNEL_ID,
      user_id: userId,
    });
    return member !== null && ["member", "administrator", "creator"].includes(member.status);
  },
  async hasProfilePhoto(userId) {
    const photos = await call<{ total_count: number }>("getUserProfilePhotos", { user_id: userId, limit: 1 });
    return (photos?.total_count ?? 0) > 0;
  },
  async channelMemberCount() {
    return call<number>("getChatMemberCount", { chat_id: process.env.TELEGRAM_CHANNEL_ID });
  },
};
