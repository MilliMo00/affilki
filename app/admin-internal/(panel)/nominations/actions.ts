"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { NOMINATION_ICON_NAMES } from "@/components/awards/NominationIcon";
import { done, failed, stepUp, type ActionState } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/admin/auth";
import { adminUrl } from "@/lib/admin/path";
import { db } from "@/lib/db";
import { parseCases, parseLinks, parseYear } from "@/lib/profile";
import { saveImage } from "@/lib/storage";
import { caseImagesFrom } from "@/lib/submissions";

const lines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const issues = (error: z.ZodError) => `Проверь поля: ${error.issues.map((i) => `${i.path.join(".")} — ${i.message}`).join("; ")}`;

const nominationSchema = z.object({
  title: z.string().trim().min(2).max(120),
  shortDesc: z.string().trim().min(2).max(160),
  description: z.string().trim().min(2).max(3000),
  criteria: z.string().transform(lines).pipe(z.array(z.string().max(200)).min(1).max(8)),
  eligibility: z.string().trim().min(2).max(500),
  icon: z.enum(NOMINATION_ICON_NAMES as [string, ...string[]]),
  coverText: z.string().trim().max(16, "Слово на обложке — не длиннее 16 символов"),
  group: z.enum(["TEAMS", "MEDIA", "MARKET"]),
  order: z.coerce.number().int().min(1).max(99),
});

export async function saveNomination(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requirePermission("awards");
  const parsed = nominationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failed(issues(parsed.error));

  const before = await db.nomination.findUnique({ where: { id } });
  if (!before) return failed("Номинация не найдена.");
  const after = await db.nomination.update({
    where: { id },
    data: {
      ...parsed.data,
      coverText: parsed.data.coverText || null,
      acceptingEntries: formData.get("acceptingEntries") === "on",
      testVoting: formData.get("testVoting") === "on",
    },
  });
  await audit(context, "nomination.update", { type: "nomination", id }, before, after);
  revalidatePath("/", "layout");
  return done();
}

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "латиница, цифры и дефисы")
  .min(2)
  .max(80);

const url = z
  .string()
  .trim()
  .regex(/^https:\/\/\S+$/, "ссылка должна начинаться с https://")
  .max(300);

const nomineeSchema = z.object({
  name: z.string().trim().min(2).max(140),
  slug,
  tagline: z.string().trim().max(200),
  description: z.string().trim().max(30_000),
  achievements: z.string().trim().max(3000).default(""),
  whyVote: z.string().trim().max(2000).default(""),
  site: url.or(z.literal("")),
  tg: url.or(z.literal("")),
  sources: z.string().transform(lines).pipe(z.array(url).max(10)),
  rightOfReply: z.string().trim().max(2000),
});

/** Создание и правка участника. id = "new" — создание в номинации nominationId. */
export async function saveNominee(nominationId: string, id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requirePermission("awards");
  const parsed = nomineeSchema.safeParse(Object.fromEntries([...formData].filter(([, value]) => typeof value === "string")));
  if (!parsed.success) return failed(issues(parsed.error));
  const buttons = parseLinks(formData, "buttonsJson");
  const year = parseYear(formData.get("foundedYear"));
  const parsedCases = parseCases(formData);
  for (const part of [buttons, year, parsedCases]) if ("errors" in part) return failed(Object.values(part.errors).join("; "));
  if ("errors" in buttons || "errors" in year || "errors" in parsedCases) return failed("Проверь поля.");

  const nomination = await db.nomination.findUnique({ where: { id: nominationId } });
  if (!nomination) return failed("Номинация не найдена.");

  const published = formData.get("published") === "on";
  const legalChecked = formData.get("legalChecked") === "on";
  const { site, tg, sources, achievements, whyVote, ...fields } = parsed.data;

  // Номинация-события: без источника и ручной проверки участник не публикуется.
  if (nomination.requiresLegalReview && published) {
    if (sources.length === 0) return failed("Для этой номинации нужен хотя бы один источник.");
    if (!legalChecked) return failed("Чтобы опубликовать, отметь «Проверено»: без этого карточка на сайт не попадёт.");
  }

  const taken = await db.nominee.findUnique({ where: { slug: fields.slug } });
  if (taken && taken.id !== id) return failed("Такой адрес (slug) уже занят другим участником.");

  let logoUrl: string | undefined;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    const saved = await saveImage(logo);
    if ("error" in saved) return failed(saved.error);
    logoUrl = saved.url;
  }

  const cases = await caseImagesFrom(formData, parsedCases.cases);
  if ("error" in cases) return failed(cases.error);

  const data = {
    ...fields,
    profile: { foundedYear: year.year, achievements, whyVote, cases: cases.cases, buttons: buttons.links },
    tagline: fields.tagline || null,
    description: fields.description || null,
    rightOfReply: fields.rightOfReply || null,
    links: { ...(site && { site }), ...(tg && { tg }) },
    sources,
    published,
    legalChecked,
    ...(logoUrl && { logoUrl }),
  };

  if (id === "new") {
    const created = await db.nominee.create({ data: { ...data, nominationId } });
    await audit(context, "nominee.create", { type: "nominee", id: created.id }, null, created);
    revalidatePath("/", "layout");
    redirect(adminUrl(`/nominees/${created.id}`));
  }

  const before = await db.nominee.findUnique({ where: { id } });
  if (!before) return failed("Участник не найден.");
  const after = await db.nominee.update({ where: { id }, data });
  await audit(context, "nominee.update", { type: "nominee", id }, before, after);
  revalidatePath("/", "layout");
  return done();
}

/** Удаление участника — опасное действие: нужен свежий код. С голосами удалить нельзя. */
export async function deleteNominee(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requirePermission("awards");
  const denied = await stepUp(context, formData);
  if (denied) return failed(denied);

  const nominee = await db.nominee.findUnique({ where: { id }, include: { _count: { select: { votes: true } } } });
  if (!nominee) return failed("Участник не найден.");
  if (nominee._count.votes > 0) return failed("За участника уже голосовали. Сними его с публикации вместо удаления.");

  await db.nominee.delete({ where: { id } });
  await audit(context, "nominee.delete", { type: "nominee", id }, nominee, null);
  revalidatePath("/", "layout");
  redirect(adminUrl(`/nominations/${nominee.nominationId}`));
}
