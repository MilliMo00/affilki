"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { done, failed, stepUp, type ActionState } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/admin/auth";
import { adminUrl } from "@/lib/admin/path";
import { db } from "@/lib/db";
import { plainText, readingMinutes, renderMarkup } from "@/lib/markup";
import { slugify } from "@/lib/slug";
import { saveImage } from "@/lib/storage";

const schema = z.object({
  title: z.string().trim().min(3, "Заголовок слишком короткий").max(200),
  slug: z.string().trim().toLowerCase().max(80),
  categoryId: z.string().min(1, "Выбери рубрику"),
  authorName: z.string().trim().min(1).max(100),
  excerpt: z.string().trim().max(300),
  source: z.string().max(60_000),
  seoTitle: z.string().trim().max(200),
  seoDesc: z.string().trim().max(300),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

/** Создание и правка статьи. id = "new" — создание. */
export async function saveArticle(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requirePermission("content");
  const parsed = schema.safeParse(Object.fromEntries([...formData].filter(([, v]) => typeof v === "string")));
  if (!parsed.success) return failed(parsed.error.issues.map((i) => i.message).join("; "));
  const { source, slug: rawSlug, seoTitle, seoDesc, ...fields } = parsed.data;

  const before = id === "new" ? null : await db.article.findUnique({ where: { id } });
  if (id !== "new" && !before) return failed("Статья не найдена.");
  // Старые статьи хранятся готовым HTML без исходника: пустой текст их не затирает.
  const hasSource = source.trim().length > 0;
  if (!hasSource && !before?.contentHtml) return failed("Текст статьи пустой.");

  const slug = slugify(rawSlug || fields.title);
  const taken = await db.article.findUnique({ where: { slug } });
  if (taken && taken.id !== id) return failed("Такой адрес уже занят другой статьёй.");

  let coverUrl: string | undefined;
  const cover = formData.get("cover");
  if (cover instanceof File && cover.size > 0) {
    const saved = await saveImage(cover);
    if ("error" in saved) return failed(saved.error);
    coverUrl = saved.url;
  }

  const data = {
    ...fields,
    slug,
    excerpt: fields.excerpt || (hasSource ? plainText(source).slice(0, 180) : (before?.excerpt ?? "")),
    seoTitle: seoTitle || null,
    seoDesc: seoDesc || null,
    ...(hasSource && { contentSource: source, contentHtml: renderMarkup(source), readingMin: readingMinutes(source) }),
    ...(coverUrl && { coverUrl }),
    // Дата публикации ставится при первом переводе в «Опубликовано».
    ...(fields.status === "PUBLISHED" && !before?.publishedAt && { publishedAt: new Date() }),
  };

  if (!before) {
    const created = await db.article.create({ data: { ...data, contentHtml: data.contentHtml ?? "", readingMin: data.readingMin ?? 1 } });
    await audit(context, "article.create", { type: "article", id: created.id }, null, { title: created.title, status: created.status });
    revalidatePath("/", "layout");
    redirect(adminUrl(`/articles/${created.id}`));
  }

  const after = await db.article.update({ where: { id }, data });
  await audit(context, "article.update", { type: "article", id }, { title: before.title, status: before.status, slug: before.slug }, { title: after.title, status: after.status, slug: after.slug });
  revalidatePath("/", "layout");
  return done();
}

export async function deleteArticle(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requirePermission("content");
  const denied = await stepUp(context, formData);
  if (denied) return failed(denied);

  const article = await db.article.findUnique({ where: { id } });
  if (!article) return failed("Статья не найдена.");
  await db.article.delete({ where: { id } });
  await audit(context, "article.delete", { type: "article", id }, { title: article.title, slug: article.slug }, null);
  revalidatePath("/", "layout");
  redirect(adminUrl("/articles"));
}

const categorySchema = z.object({
  title: z.string().trim().min(2, "Название слишком короткое").max(40),
  slug: z.string().trim().toLowerCase().max(40),
  order: z.coerce.number().int().min(0).max(99),
});

export async function saveCategory(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requirePermission("content");
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failed(parsed.error.issues[0].message);
  const slug = slugify(parsed.data.slug || parsed.data.title);
  const taken = await db.category.findUnique({ where: { slug } });
  if (taken && taken.id !== id) return failed("Рубрика с таким адресом уже есть.");

  const data = { title: parsed.data.title, slug, order: parsed.data.order };
  if (id === "new") {
    const created = await db.category.create({ data });
    await audit(context, "category.create", { type: "category", id: created.id }, null, data);
  } else {
    const before = await db.category.findUnique({ where: { id } });
    if (!before) return failed("Рубрика не найдена.");
    await db.category.update({ where: { id }, data });
    await audit(context, "category.update", { type: "category", id }, { title: before.title, slug: before.slug }, data);
  }
  revalidatePath("/", "layout");
  return done();
}

export async function deleteCategory(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requirePermission("content");
  const denied = await stepUp(context, formData);
  if (denied) return failed(denied);

  const category = await db.category.findUnique({ where: { id }, include: { _count: { select: { articles: true } } } });
  if (!category) return failed("Рубрика не найдена.");
  if (category._count.articles > 0) return failed(`В рубрике статей: ${category._count.articles}. Сначала перенеси или удали их.`);
  await db.category.delete({ where: { id } });
  await audit(context, "category.delete", { type: "category", id }, { title: category.title }, null);
  revalidatePath("/", "layout");
  return done("Рубрика удалена");
}
