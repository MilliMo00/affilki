import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { rateLimiter } from "@/lib/ratelimit";
import { clientIp, hashValue, isSameOrigin } from "@/lib/request";
import { notifyOwnerAboutClaim } from "@/lib/submissions";

/** Команда отказывается от заявки, подготовленной редакцией. Ссылка сгорает, владельцу уходит уведомление. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Запрос отклонён" }, { status: 403 });
  const limit = await rateLimiter.hit(`claim-decline:${hashValue(clientIp(request))}`, 20, 60 * 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Слишком часто. Попробуй позже." }, { status: 429 });

  const invite = await db.submission.findUnique({ where: { inviteToken: (await params).token } });
  if (!invite || invite.status !== "INVITED") return NextResponse.json({ error: "Ссылка уже не действует." }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as { comment?: unknown };
  const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 1000) : "";
  const declined = await db.submission.update({
    where: { id: invite.id },
    data: { status: "REJECTED", inviteToken: null, adminComment: `Команда отказалась${comment ? `: ${comment}` : "."}` },
  });
  void notifyOwnerAboutClaim(declined, "declined", comment);
  return NextResponse.json({ ok: true });
}
