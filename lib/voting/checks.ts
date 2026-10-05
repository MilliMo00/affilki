import type { Season } from "@prisma/client";
import { db } from "@/lib/db";
import type { TelegramApi } from "@/lib/telegram/client";

export type Account = { tgUserId: bigint; username: string | null; hasAvatar: boolean };

export type CheckFailure = "banned" | "too_new" | "no_username" | "no_avatar" | "not_subscribed";

export const CHECK_MESSAGES: Record<CheckFailure, string> = {
  banned: "Этот аккаунт не может голосовать.",
  too_new: "Этот аккаунт не может голосовать в этом сезоне: он создан слишком недавно.",
  no_username: "Чтобы голосовать, задай username в настройках Telegram.",
  no_avatar: "Чтобы голосовать, поставь фото профиля в Telegram.",
  not_subscribed: "Чтобы голосовать, подпишись на канал AFFILKI.",
};

type Thresholds = Pick<Season, "requireChannel" | "requireUsername" | "requireAvatar" | "maxTelegramId">;

/** Проверки Telegram-аккаунта по порогам сезона. Возвращает первую причину отказа или null. */
export async function checkAccount(
  account: Account,
  season: Thresholds,
  tg: Pick<TelegramApi, "isChannelMember">,
): Promise<CheckFailure | null> {
  if (await db.tgBan.findUnique({ where: { tgUserId: account.tgUserId } })) return "banned";
  // Чем меньше ID, тем старше аккаунт: выше порога — слишком свежий.
  if (season.maxTelegramId !== null && account.tgUserId > season.maxTelegramId) return "too_new";
  if (season.requireUsername && !account.username) return "no_username";
  if (season.requireAvatar && !account.hasAvatar) return "no_avatar";
  if (season.requireChannel && !(await tg.isChannelMember(Number(account.tgUserId)))) return "not_subscribed";
  return null;
}
