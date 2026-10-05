import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimiter } from "@/lib/ratelimit";
import { clientIp, hashValue, isSameOrigin } from "@/lib/request";
import { telegram, type TelegramApi } from "@/lib/telegram/client";
import { verifyTurnstile } from "@/lib/turnstile";
import { sessionToken } from "@/lib/voting/cookies";
import { findSession } from "@/lib/voting/login";
import { castVote, votesOf } from "@/lib/voting/vote";

// В разработке с DEV_FAKE_BOT тестовый аккаунт не существует в Telegram — подписку считаем пройденной.
const fakeBot = process.env.NODE_ENV !== "production" && process.env.DEV_FAKE_BOT === "true";
const voteTelegram: Pick<TelegramApi, "isChannelMember" | "sendMessage"> = fakeBot
  ? { isChannelMember: async () => true, sendMessage: async () => {} }
  : telegram;

const bodySchema = z.object({ nomineeSlug: z.string().min(1).max(120), captchaToken: z.string().min(1).max(4096) });

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "forbidden", message: "Запрос отклонён" }, { status: 403 });

  const session = await findSession(sessionToken(request));
  if (!session) return NextResponse.json({ error: "unauthorized", message: "Сначала войди через бота." }, { status: 401 });

  const ip = clientIp(request);
  const ipHash = hashValue(ip);
  const [byUser, byIp] = await Promise.all([
    rateLimiter.hit(`vote:u:${session.tgUserId}`, 10, 60_000),
    rateLimiter.hit(`vote:ip:${ipHash}`, 10, 60_000),
  ]);
  if (!byUser.ok || !byIp.ok) {
    return NextResponse.json({ error: "rate_limit", message: "Слишком часто. Подожди минуту." }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request", message: "Неверный запрос." }, { status: 400 });

  const result = await castVote(
    {
      session,
      nomineeSlug: parsed.data.nomineeSlug,
      captchaToken: parsed.data.captchaToken,
      ipHash,
      uaHash: hashValue(request.headers.get("user-agent") ?? ""),
    },
    { tg: voteTelegram, verifyCaptcha: (token) => verifyTurnstile(token, ip) },
  );

  if (!result.ok) {
    const status = result.error === "not_found" ? 404 : result.error === "already_voted" ? 409 : 403;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json({ ...result, votes: await votesOf(session.tgUserId) });
}
