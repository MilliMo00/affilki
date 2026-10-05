import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { handleUpdate } from "@/lib/telegram/bot";
import { telegram } from "@/lib/telegram/client";

function secretMatches(received: string | null) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || !received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Webhook бота. Запросы без секретного заголовка Telegram отклоняются. */
export async function POST(request: Request) {
  if (!secretMatches(request.headers.get("x-telegram-bot-api-secret-token"))) {
    return new NextResponse(null, { status: 401 });
  }
  try {
    await handleUpdate(await request.json(), telegram);
  } catch (error) {
    // Telegram повторяет доставку при не-200, а повтор сломанного обновления ничего не исправит.
    console.error("tg webhook:", error);
  }
  return NextResponse.json({ ok: true });
}
