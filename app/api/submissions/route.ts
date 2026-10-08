import { NextResponse, type NextRequest } from "next/server";
import { recordServerEvent } from "@/lib/analytics/record";
import { db } from "@/lib/db";
import { readDetails, readLinks } from "@/lib/profile";
import { rateLimiter } from "@/lib/ratelimit";
import { clientIp, hashValue, isSameOrigin } from "@/lib/request";
import { caseImagesFrom, checkTarget, fieldsOf, imageFrom, notifyAdminAboutSubmission, parseSubmission } from "@/lib/submissions";
import { sessionToken } from "@/lib/voting/cookies";
import { findSession } from "@/lib/voting/login";

/** Заявки текущего пользователя — для страницы «Мои заявки». */
export async function GET(request: NextRequest) {
  const session = await findSession(sessionToken(request));
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rows = await db.submission.findMany({ where: { tgUserId: session.tgUserId }, orderBy: { updatedAt: "desc" } });
  const [nominees, articles] = await Promise.all([
    db.nominee.findMany({ where: { id: { in: rows.map((r) => r.resultId ?? "") } }, select: { id: true, slug: true } }),
    db.article.findMany({ where: { id: { in: rows.map((r) => r.resultId ?? "") } }, select: { id: true, slug: true } }),
  ]);
  const urlById = new Map([...nominees.map((n) => [n.id, `/n/${n.slug}`] as const), ...articles.map((a) => [a.id, `/a/${a.slug}`] as const)]);

  return NextResponse.json({
    submissions: rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      status: row.status,
      authorName: row.authorName,
      contact: row.contact,
      title: row.title,
      text: row.text,
      imageUrl: row.imageUrl,
      links: readLinks(row.links),
      details: row.kind === "NOMINEE" ? readDetails(row.details) : null,
      nominationId: row.nominationId,
      categorySlug: row.categorySlug,
      adminComment: row.adminComment,
      publicUrl: row.resultId ? (urlById.get(row.resultId) ?? null) : null,
      updatedAt: row.updatedAt,
    })),
  });
}

/** Новая заявка. Только после входа через бота: автору потом уходят уведомления. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Запрос отклонён" }, { status: 403 });
  const session = await findSession(sessionToken(request));
  if (!session) return NextResponse.json({ error: "Сначала войди через бота." }, { status: 401 });
  if (await db.tgBan.findUnique({ where: { tgUserId: session.tgUserId } })) {
    return NextResponse.json({ error: "Этот аккаунт не может подавать заявки." }, { status: 403 });
  }

  const ipHash = hashValue(clientIp(request));
  const limit = await rateLimiter.hit(`submission:${session.tgUserId}`, 5, 60 * 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Слишком много заявок. Попробуй через час." }, { status: 429 });

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Неверный запрос." }, { status: 400 });
  // Honeypot: человек это поле не видит.
  if (String(formData.get("website") ?? "") !== "") return NextResponse.json({ ok: true });

  const parsed = parseSubmission(formData);
  if ("errors" in parsed) return NextResponse.json({ errors: parsed.errors }, { status: 400 });
  const targetErrors = await checkTarget(parsed.data, true);
  if (targetErrors) return NextResponse.json({ errors: targetErrors }, { status: 400 });

  const image = await imageFrom(formData);
  if ("error" in image) return NextResponse.json({ errors: { image: image.error } }, { status: 400 });
  const cases = await caseImagesFrom(formData, parsed.data.cases);
  if ("error" in cases) return NextResponse.json({ errors: { cases: cases.error } }, { status: 400 });

  const submission = await db.submission.create({
    data: { ...fieldsOf(parsed.data, cases.cases), imageUrl: image.url, tgUserId: session.tgUserId, tgUsername: session.tgUsername, ipHash },
  });
  recordServerEvent(request, { type: "submit_request", meta: { kind: submission.kind } });
  void notifyAdminAboutSubmission(submission, false);
  return NextResponse.json({ ok: true, id: submission.id });
}
