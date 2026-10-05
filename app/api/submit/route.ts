import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimiter } from "@/lib/ratelimit";
import { clientIp, hashValue, isSameOrigin } from "@/lib/request";
import { fieldErrors, submitSchema } from "@/lib/validation/submit";

const LIMIT = 3;
const WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Запрос отклонён" }, { status: 403 });

  const body = await request.json().catch(() => null);
  // Honeypot заполнен — это бот. Отвечаем «успехом», чтобы он не подбирал обход.
  if (body && typeof body.website === "string" && body.website.length > 0) return NextResponse.json({ ok: true });

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });

  const ipHash = hashValue(clientIp(request));
  const limit = await rateLimiter.hit(`submit:${ipHash}`, LIMIT, WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json({ error: "Слишком много заявок. Попробуй через час." }, { status: 429 });
  }

  const { name, tg, category, title, description, draftUrl } = parsed.data;
  if (!(await db.category.findUnique({ where: { slug: category } }))) {
    return NextResponse.json({ errors: { category: "Такой рубрики нет" } }, { status: 400 });
  }

  await db.articleRequest.create({
    data: { name, tgContact: tg, category, title, description, draftUrl: draftUrl || null, ipHash },
  });
  return NextResponse.json({ ok: true });
}
