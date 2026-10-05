import type { Submission } from "@prisma/client";
import { z } from "zod";
import { notifyOwner } from "@/lib/admin/auth";
import { adminUrl } from "@/lib/admin/path";
import { db } from "@/lib/db";
import { plainText, readingMinutes, renderMarkup } from "@/lib/markup";
import { uniqueSlug } from "@/lib/slug";
import { saveImage } from "@/lib/storage";
import { telegram } from "@/lib/telegram/client";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://affilki.com";

const link = z
  .string()
  .trim()
  .regex(/^https:\/\/\S+$/, "Ссылки должны начинаться с https://")
  .max(300);

// Одна схема для автора и для модератора: и на сайте, и в админке поля проверяются одинаково.
export const submissionSchema = z
  .object({
    kind: z.enum(["NOMINEE", "ARTICLE"]),
    authorName: z.string().trim().min(2, "Укажи имя или название команды").max(100),
    contact: z.string().trim().min(3, "Укажи контакт для связи").max(120),
    title: z.string().trim().min(2, "Укажи название").max(160),
    text: z.string().trim().min(30, "Текст слишком короткий — нужно хотя бы пару предложений").max(30_000),
    links: z
      .string()
      .transform((value) => value.split("\n").map((line) => line.trim()).filter(Boolean))
      .pipe(z.array(link).max(10, "Не больше 10 ссылок")),
    nominationId: z.string().max(40).optional(),
    categorySlug: z.string().max(60).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.kind === "NOMINEE" && !value.nominationId) ctx.addIssue({ code: "custom", path: ["nominationId"], message: "Выбери номинацию" });
    if (value.kind === "ARTICLE" && !value.categorySlug) ctx.addIssue({ code: "custom", path: ["categorySlug"], message: "Выбери рубрику" });
  });

export type SubmissionInput = z.infer<typeof submissionSchema>;
export type FieldErrors = Record<string, string>;

export function parseSubmission(formData: FormData): { data: SubmissionInput } | { errors: FieldErrors } {
  const raw = Object.fromEntries([...formData].filter(([, value]) => typeof value === "string"));
  const parsed = submissionSchema.safeParse({ ...raw, nominationId: raw.nominationId || undefined, categorySlug: raw.categorySlug || undefined });
  if (parsed.success) return { data: parsed.data };
  const errors: FieldErrors = {};
  for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
  return { errors };
}

/** Проверяет, что номинация принимает заявки или рубрика существует. */
export async function checkTarget(data: SubmissionInput): Promise<FieldErrors | null> {
  if (data.kind === "NOMINEE") {
    const nomination = await db.nomination.findUnique({ where: { id: data.nominationId } });
    if (!nomination) return { nominationId: "Такой номинации нет" };
    if (!nomination.acceptingEntries) return { nominationId: "В эту номинацию заявки сейчас не принимаются" };
  } else if (!(await db.category.findUnique({ where: { slug: data.categorySlug } }))) {
    return { categorySlug: "Такой рубрики нет" };
  }
  return null;
}

/** Картинка из формы: новая сохраняется, пустое поле оставляет прежнюю. */
export async function imageFrom(formData: FormData, current: string | null = null): Promise<{ url: string | null } | { error: string }> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { url: current };
  const saved = await saveImage(file);
  return "error" in saved ? saved : { url: saved.url };
}

export const fieldsOf = (data: SubmissionInput) => ({
  kind: data.kind,
  authorName: data.authorName,
  contact: data.contact,
  title: data.title,
  text: data.text,
  links: data.links,
  nominationId: data.kind === "NOMINEE" ? data.nominationId! : null,
  categorySlug: data.kind === "ARTICLE" ? data.categorySlug! : null,
});

// ── Уведомления ────────────────────────────────────────────────────────────

const KIND = { NOMINEE: "в номинацию", ARTICLE: "на статью" } as const;

export async function notifyAdminAboutSubmission(submission: Submission, resubmitted: boolean) {
  await notifyOwner(
    `${resubmitted ? "Заявка исправлена автором" : "Новая заявка"} ${KIND[submission.kind]}: «${submission.title}»\n${SITE}${adminUrl(`/submissions/${submission.id}`)}`,
  );
}

async function notifyAuthor(submission: Submission, text: string, url = `${SITE}/my`) {
  await telegram.sendMessage(Number(submission.tgUserId), text, [[{ text: "Открыть на сайте", url }]]).catch(() => {});
}

// ── Решения модератора ─────────────────────────────────────────────────────

export async function returnForChanges(submission: Submission, comment: string) {
  const updated = await db.submission.update({ where: { id: submission.id }, data: { status: "CHANGES_REQUESTED", adminComment: comment } });
  await notifyAuthor(updated, `Заявка «${updated.title}» вернулась с правками.\n\nКомментарий редактора:\n${comment}\n\nИсправь и отправь заново.`);
  return updated;
}

export async function reject(submission: Submission, comment: string) {
  const updated = await db.submission.update({ where: { id: submission.id }, data: { status: "REJECTED", adminComment: comment } });
  await notifyAuthor(updated, `Заявку «${updated.title}» не приняли.\n\nКомментарий редактора:\n${comment}`);
  return updated;
}

/** Одобрение: из заявки создаётся участник номинации или статья, автору уходит ссылка. */
export async function approve(submission: Submission, extra: { tagline: string; excerpt: string }) {
  const links = Array.isArray(submission.links) ? (submission.links as string[]) : [];
  let resultId: string;
  let publicUrl: string;
  let note = "";

  if (submission.kind === "NOMINEE") {
    const nomination = await db.nomination.findUniqueOrThrow({ where: { id: submission.nominationId! } });
    const tg = links.find((url) => /^https:\/\/t\.me\//.test(url));
    const site = links.find((url) => url !== tg);
    const nominee = await db.nominee.create({
      data: {
        nominationId: nomination.id,
        slug: await uniqueSlug(submission.title, async (slug) => !!(await db.nominee.findUnique({ where: { slug } }))),
        name: submission.title,
        tagline: extra.tagline || null,
        description: plainText(submission.text),
        logoUrl: submission.imageUrl,
        links: { ...(site && { site }), ...(tg && { tg }) },
        sources: links,
        published: true,
        // Номинация-события: карточка не появится, пока модератор отдельно не отметит «Проверено».
        legalChecked: false,
      },
    });
    resultId = nominee.id;
    publicUrl = `${SITE}/n/${nominee.slug}`;
    if (nomination.requiresLegalReview) note = "\n\nКарточка появится на сайте после финальной проверки редактором.";
  } else {
    const category = await db.category.findUniqueOrThrow({ where: { slug: submission.categorySlug! } });
    const article = await db.article.create({
      data: {
        slug: await uniqueSlug(submission.title, async (slug) => !!(await db.article.findUnique({ where: { slug } }))),
        title: submission.title,
        excerpt: extra.excerpt || plainText(submission.text).slice(0, 180),
        contentSource: submission.text,
        contentHtml: renderMarkup(submission.text),
        coverUrl: submission.imageUrl,
        categoryId: category.id,
        authorName: submission.authorName,
        readingMin: readingMinutes(submission.text),
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
    resultId = article.id;
    publicUrl = `${SITE}/a/${article.slug}`;
  }

  const updated = await db.submission.update({ where: { id: submission.id }, data: { status: "APPROVED", resultId, adminComment: null } });
  await notifyAuthor(updated, `Заявка «${updated.title}» одобрена и опубликована.${note}`, publicUrl);
  return { submission: updated, resultId, publicUrl };
}
