import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isSameOrigin } from "@/lib/request";
import { clearSessionCookie, sessionToken } from "@/lib/voting/cookies";
import { findSession } from "@/lib/voting/login";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Запрос отклонён" }, { status: 403 });

  const session = await findSession(sessionToken(request));
  if (session) await db.voterSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } });

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
