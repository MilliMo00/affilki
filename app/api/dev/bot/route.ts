import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { TelegramApi } from "@/lib/telegram/client";
import { handleDecision, handleStart } from "@/lib/voting/login";

// ТОЛЬКО ДЛЯ РАЗРАБОТКИ: проходит шаги бота без Telegram, чтобы вход можно было
// проверить на localhost (webhook туда не достаёт). В проде адрес отдаёт 404.
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" || process.env.DEV_FAKE_BOT !== "true") {
    return new NextResponse(null, { status: 404 });
  }
  const { token, tgUserId = 111_000_111, subscribed = true } = await request.json();
  const from = { id: Number(tgUserId), username: "test_user", first_name: "Тест" };
  const fake: TelegramApi = {
    sendMessage: async () => {},
    editMessage: async () => {},
    answerCallback: async () => {},
    isChannelMember: async () => subscribed,
    hasProfilePhoto: async () => true,
    usernameOf: async () => "test_user",
    channelMemberCount: async () => null,
  };

  await handleStart(token, from, fake);
  const intent = await db.loginIntent.findUnique({ where: { token } });
  if (!intent) return NextResponse.json({ error: "no intent" }, { status: 404 });
  const reply = await handleDecision("ok", intent.id, from, fake);
  return NextResponse.json({ reply: reply.text });
}
