import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { plainText } from "@/lib/markup";
import { rateLimiter } from "@/lib/ratelimit";
import { clientIp, hashValue, isSameOrigin } from "@/lib/request";
import {
  approve,
  caseImagesFrom,
  checkTarget,
  contentFingerprint,
  fieldsOf,
  imageFrom,
  nominationIsFull,
  notifyOwnerAboutClaim,
  parseSubmission,
} from "@/lib/submissions";
import { sessionToken } from "@/lib/voting/cookies";
import { findSession } from "@/lib/voting/login";

/**
 * Команда подтверждает заявку, которую за неё подготовила редакция.
 * Без правок — участник сразу публикуется; с правками — заявка уходит модератору.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Запрос отклонён" }, { status: 403 });
  const session = await findSession(sessionToken(request));
  if (!session) return NextResponse.json({ error: "Сначала войди через бота." }, { status: 401 });
  if (await db.tgBan.findUnique({ where: { tgUserId: session.tgUserId } })) {
    return NextResponse.json({ error: "Этот аккаунт не может подавать заявки." }, { status: 403 });
  }
  const limit = await rateLimiter.hit(`claim:${session.tgUserId}`, 30, 60 * 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Слишком часто. Попробуй позже." }, { status: 429 });

  const invite = await db.submission.findUnique({ where: { inviteToken: (await params).token } });
  if (!invite || invite.status !== "INVITED") return NextResponse.json({ error: "Ссылка уже не действует." }, { status: 404 });

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Неверный запрос." }, { status: 400 });
  formData.set("kind", "NOMINEE");
  const parsed = parseSubmission(formData);
  if ("errors" in parsed) return NextResponse.json({ errors: parsed.errors }, { status: 400 });
  const targetErrors = await checkTarget(parsed.data, true, { tgUserId: session.tgUserId, exceptId: invite.id });
  if (targetErrors) return NextResponse.json({ errors: targetErrors }, { status: 400 });

  const image = await imageFrom(formData, invite.imageUrl);
  if ("error" in image) return NextResponse.json({ errors: { image: image.error } }, { status: 400 });
  const cases = await caseImagesFrom(formData, parsed.data.cases);
  if ("error" in cases) return NextResponse.json({ errors: { cases: cases.error } }, { status: 400 });

  const fields = { ...fieldsOf(parsed.data, cases.cases), imageUrl: image.url };
  const unchanged = contentFingerprint(invite) === contentFingerprint({ ...invite, ...fields });

  // Ссылка сгорает: заявка теперь принадлежит этому Telegram-аккаунту и видна в «Моих заявках».
  const claimed = await db.submission.update({
    where: { id: invite.id },
    data: { ...fields, tgUserId: session.tgUserId, tgUsername: session.tgUsername, inviteToken: null, status: "PENDING", ipHash: hashValue(clientIp(request)) },
  });

  if (unchanged && !(await nominationIsFull(claimed.nominationId!))) {
    const tagline = plainText(claimed.text).split(/(?<=[.!?])\s/)[0]?.slice(0, 160) ?? "";
    const result = await approve(claimed, { tagline, excerpt: "" });
    void notifyOwnerAboutClaim(claimed, "published");
    return NextResponse.json({ ok: true, published: true, url: result.publicUrl.replace(/^https?:\/\/[^/]+/, "") });
  }
  void notifyOwnerAboutClaim(claimed, "edited");
  return NextResponse.json({ ok: true, published: false });
}
