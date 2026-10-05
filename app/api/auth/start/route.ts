import { NextResponse, type NextRequest } from "next/server";
import QRCode from "qrcode";
import { recordServerEvent } from "@/lib/analytics/record";
import { rateLimiter } from "@/lib/ratelimit";
import { clientIp, hashValue, isSameOrigin } from "@/lib/request";
import { setLoginCookie } from "@/lib/voting/cookies";
import { startLogin } from "@/lib/voting/login";
import { uaLabel } from "@/lib/voting/tokens";

/** Создаёт одноразовую ссылку входа через бота. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Запрос отклонён" }, { status: 403 });

  const ipHash = hashValue(clientIp(request));
  const limit = await rateLimiter.hit(`login:${ipHash}`, 5, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Слишком много попыток. Подожди минуту." }, { status: 429 });

  const ua = request.headers.get("user-agent") ?? "";
  const { token, browserSecret, expiresAt } = await startLogin({ ipHash, uaHash: hashValue(ua), uaLabel: uaLabel(ua) });

  recordServerEvent(request, { type: "login_start" });

  const url = `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=l_${token}`;
  const qr = await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#120B3D", light: "#FFFFFF" } });

  const fakeBot = process.env.NODE_ENV !== "production" && process.env.DEV_FAKE_BOT === "true";
  const response = NextResponse.json({ url, qr, expiresAt, devToken: fakeBot ? token : undefined });
  setLoginCookie(response, browserSecret);
  return response;
}
