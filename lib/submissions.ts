import type { Submission } from "@prisma/client";
import { z } from "zod";
import { notifyOwner } from "@/lib/admin/auth";
import { adminUrl } from "@/lib/admin/path";
import { db } from "@/lib/db";
import { plainText, readingMinutes, renderMarkup } from "@/lib/markup";
import { isTelegramLink, parseCases, parseLinks, parseYear, readDetails, readLinks, type CaseItem, type LinkButton, type NomineeDetails, type ParsedCase } from "@/lib/profile";
import { uniqueSlug } from "@/lib/slug";
import { saveImage } from "@/lib/storage";
import { telegram } from "@/lib/telegram/client";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://affilki.com";

// Браузер присылает переносы как \r\n — храним обычные.
const multiline = (max: number, message: string) =>
  z
    .string()
    .transform((value) => value.replace(/\r\n?/g, "\n").trim())
    .pipe(z.string().max(max, message));

// Одна схема для автора и для модератора: и на сайте, и в админке поля проверяются одинаково.
export const submissionSchema = z
  .object({
    kind: z.enum(["NOMINEE", "ARTICLE"]),
    authorName: z.string().trim().min(2, "Укажи имя или название команды").max(100),
    contact: z.string().trim().min(3, "Укажи контакт для связи").max(120),
    title: z.string().trim().min(2, "Укажи название").max(160),
    text: multiline(30_000, "Текст слишком длинный").pipe(z.string().min(30, "Текст слишком короткий — нужно хотя бы пару предложений")),
    // Только для заявки в номинацию.
    achievements: multiline(3000, "Слишком длинно — уложись в 3000 символов").default(""),
    whyVote: multiline(2000, "Слишком длинно — уложись в 2000 символов").default(""),
    nominationId: z.string().max(40).optional(),
    categorySlug: z.string().max(60).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.kind === "NOMINEE" && !value.nominationId) ctx.addIssue({ code: "custom", path: ["nominationId"], message: "Выбери номинацию" });
    if (value.kind === "ARTICLE" && !value.categorySlug) ctx.addIssue({ code: "custom", path: ["categorySlug"], message: "Выбери рубрику" });
  });

export type SubmissionInput = z.infer<typeof submissionSchema> & { links: LinkButton[]; foundedYear: number | null; cases: ParsedCase[] };
export type FieldErrors = Record<string, string>;

export function parseSubmission(formData: FormData): { data: SubmissionInput } | { errors: FieldErrors } {
  const raw = Object.fromEntries([...formData].filter(([, value]) => typeof value === "string"));
  const parsed = submissionSchema.safeParse({ ...raw, nominationId: raw.nominationId || undefined, categorySlug: raw.categorySlug || undefined });
  const links = parseLinks(formData);
  const year = parseYear(formData.get("foundedYear"));
  const cases = parseCases(formData);

  const errors: FieldErrors = {};
  if (!parsed.success) for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
  for (const part of [links, year, cases]) if ("errors" in part) Object.assign(errors, part.errors);
  if (!parsed.success || "errors" in links || "errors" in year || "errors" in cases) return { errors };
  return { data: { ...parsed.data, links: links.links, foundedYear: year.year, cases: cases.cases } };
}

/**
 * Проверяет, что номинация принимает заявки или рубрика существует.
 * requireDetails — автор обязан рассказать, что сделано за год и почему голосовать за него
 * (кроме номинации-событий: там описывается событие, а не команда).
 */
export async function checkTarget(data: SubmissionInput, requireDetails = false): Promise<FieldErrors | null> {
  if (data.kind === "NOMINEE") {
    const nomination = await db.nomination.findUnique({ where: { id: data.nominationId } });
    if (!nomination) return { nominationId: "Такой номинации нет" };
    if (!nomination.acceptingEntries) return { nominationId: "В эту номинацию заявки сейчас не принимаются" };
    if (requireDetails && !nomination.requiresLegalReview) {
      const errors: FieldErrors = {};
      if (data.achievements.length < 20) errors.achievements = "Расскажи, что сделали за год, — хотя бы пару предложений";
      if (data.whyVote.length < 20) errors.whyVote = "Напиши, почему голосовать стоит за вас, — хотя бы пару предложений";
      if (Object.keys(errors).length > 0) return errors;
    }
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

/** Картинки кейсов: новые файлы (поля `caseImage:<key>`) сохраняются, у остальных остаётся прежняя. */
export async function caseImagesFrom(formData: FormData, cases: ParsedCase[]): Promise<{ cases: CaseItem[] } | { error: string }> {
  const result: CaseItem[] = [];
  for (const { key, ...item } of cases) {
    const file = formData.get(`caseImage:${key}`);
    if (file instanceof File && file.size > 0) {
      const saved = await saveImage(file);
      if ("error" in saved) return { error: `Картинка кейса «${item.title}»: ${saved.error}` };
      item.imageUrl = saved.url;
    }
    result.push(item);
  }
  return { cases: result };
}

export const fieldsOf = (data: SubmissionInput, cases: CaseItem[]) => ({
  kind: data.kind,
  authorName: data.authorName,
  contact: data.contact,
  title: data.title,
  text: data.text,
  links: data.links,
  details:
    data.kind === "NOMINEE"
      ? ({ foundedYear: data.foundedYear, achievements: data.achievements, whyVote: data.whyVote, cases } satisfies NomineeDetails)
      : undefined,
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
  const links = readLinks(submission.links);
  let resultId: string;
  let publicUrl: string;
  let note = "";

  if (submission.kind === "NOMINEE") {
    const nomination = await db.nomination.findUniqueOrThrow({ where: { id: submission.nominationId! } });
    const tg = links.find((link) => isTelegramLink(link.url))?.url;
    const site = links.find((link) => link.url !== tg)?.url;
    const nominee = await db.nominee.create({
      data: {
        nominationId: nomination.id,
        slug: await uniqueSlug(submission.title, async (slug) => !!(await db.nominee.findUnique({ where: { slug } }))),
        name: submission.title,
        tagline: extra.tagline || null,
        // Текст сохраняется как есть, с переносами строк: страница участника показывает их.
        description: submission.text,
        profile: { ...readDetails(submission.details), buttons: links },
        logoUrl: submission.imageUrl,
        links: { ...(site && { site }), ...(tg && { tg }) },
        // Источники нужны только номинации-событиям; у остальных ссылки показываются кнопками.
        sources: nomination.requiresLegalReview ? links.map((link) => link.url) : [],
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
