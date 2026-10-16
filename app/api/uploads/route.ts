import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { rateLimiter } from "@/lib/ratelimit";
import { isSameOrigin } from "@/lib/request";
import { saveImage } from "@/lib/storage";
import { sessionToken } from "@/lib/voting/cookies";
import { findSession } from "@/lib/voting/login";

/**
 * Фото для блока в статье из заявки: редактор загружает его сразу и вставляет ссылку в текст.
 * Только после входа через бота; тип файла проверяется по сигнатуре, SVG запрещён (lib/storage).
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Запрос отклонён" }, { status: 403 });
  const session = await findSession(sessionToken(request));
  if (!session) return NextResponse.json({ error: "Сначала войди через бота." }, { status: 401 });
  if (await db.tgBan.findUnique({ where: { tgUserId: session.tgUserId } })) {
    return NextResponse.json({ error: "Этот аккаунт не может загружать файлы." }, { status: 403 });
  }
  const limit = await rateLimiter.hit(`upload:${session.tgUserId}`, 60, 60 * 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Слишком много загрузок. Попробуй через час." }, { status: 429 });

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("image");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Выбери картинку." }, { status: 400 });
  const saved = await saveImage(file);
  if ("error" in saved) return NextResponse.json({ error: saved.error }, { status: 400 });
  return NextResponse.json({ url: saved.url });
}
