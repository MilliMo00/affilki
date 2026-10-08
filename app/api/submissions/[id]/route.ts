import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { rateLimiter } from "@/lib/ratelimit";
import { isSameOrigin } from "@/lib/request";
import { caseImagesFrom, checkTarget, fieldsOf, imageFrom, notifyAdminAboutSubmission, parseSubmission } from "@/lib/submissions";
import { sessionToken } from "@/lib/voting/cookies";
import { findSession } from "@/lib/voting/login";

/** Автор исправляет свою заявку: можно, пока она ждёт проверки или возвращена с правками. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Запрос отклонён" }, { status: 403 });
  const session = await findSession(sessionToken(request));
  if (!session) return NextResponse.json({ error: "Сначала войди через бота." }, { status: 401 });

  const submission = await db.submission.findUnique({ where: { id: (await params).id } });
  // Чужую заявку не видно вообще — тот же ответ, что и на несуществующую.
  if (!submission || submission.tgUserId !== session.tgUserId) return NextResponse.json({ error: "Заявка не найдена." }, { status: 404 });
  if (submission.status !== "PENDING" && submission.status !== "CHANGES_REQUESTED") {
    return NextResponse.json({ error: "Эту заявку уже нельзя менять." }, { status: 409 });
  }

  const limit = await rateLimiter.hit(`submission-edit:${session.tgUserId}`, 20, 60 * 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Слишком часто. Попробуй позже." }, { status: 429 });

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Неверный запрос." }, { status: 400 });
  const parsed = parseSubmission(formData);
  if ("errors" in parsed) return NextResponse.json({ errors: parsed.errors }, { status: 400 });
  // Тип заявки после подачи не меняется.
  if (parsed.data.kind !== submission.kind) return NextResponse.json({ error: "Тип заявки изменить нельзя." }, { status: 400 });
  const targetErrors = await checkTarget(parsed.data, true);
  if (targetErrors) return NextResponse.json({ errors: targetErrors }, { status: 400 });

  const image = await imageFrom(formData, submission.imageUrl);
  if ("error" in image) return NextResponse.json({ errors: { image: image.error } }, { status: 400 });
  const cases = await caseImagesFrom(formData, parsed.data.cases);
  if ("error" in cases) return NextResponse.json({ errors: { cases: cases.error } }, { status: 400 });

  const updated = await db.submission.update({
    where: { id: submission.id },
    data: { ...fieldsOf(parsed.data, cases.cases), imageUrl: image.url, status: "PENDING" },
  });
  void notifyAdminAboutSubmission(updated, submission.status === "CHANGES_REQUESTED");
  return NextResponse.json({ ok: true, id: updated.id });
}
