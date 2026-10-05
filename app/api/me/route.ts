import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { refreshSessionCookie, sessionToken } from "@/lib/voting/cookies";
import { findSession } from "@/lib/voting/login";
import { describeVoter } from "@/lib/voting/me";

export async function GET(request: NextRequest) {
  const token = sessionToken(request);
  const session = await findSession(token);
  if (!session || !token) return NextResponse.json({ user: null, votes: {} });

  // Вход бессрочный: каждый заход на сайт продлевает cookie.
  await db.voterSession.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
  const response = NextResponse.json(await describeVoter(session));
  refreshSessionCookie(response, token);
  return response;
}
