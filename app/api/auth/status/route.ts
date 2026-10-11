import { NextResponse, type NextRequest } from "next/server";
import { rateLimiter } from "@/lib/ratelimit";
import { clientIp, hashValue } from "@/lib/request";
import { loginSecret, setSessionCookie } from "@/lib/voting/cookies";
import { claimSession, findSession } from "@/lib/voting/login";
import { describeVoter } from "@/lib/voting/me";

/** Сайт опрашивает этот адрес, пока человек подтверждает вход в боте. */
export async function GET(request: NextRequest) {
  const secret = loginSecret(request);
  if (!secret) return NextResponse.json({ status: "expired" });

  // Сайт опрашивает раз в 2 секунды (30 в минуту); с запасом на несколько вкладок и общий адрес.
  if (!(await rateLimiter.hit(`status:${hashValue(clientIp(request))}`, 240, 60_000)).ok) {
    return NextResponse.json({ status: "pending" }, { status: 429 });
  }

  const result = await claimSession(secret);
  if (result.status !== "ok") return NextResponse.json({ status: result.status });

  const session = await findSession(result.sessionToken);
  const response = NextResponse.json({ status: "ok", me: session ? await describeVoter(session) : null });
  setSessionCookie(response, result.sessionToken);
  return response;
}
