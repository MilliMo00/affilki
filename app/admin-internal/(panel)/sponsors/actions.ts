"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { done, failed, type ActionState } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { parseLinks } from "@/lib/profile";
import { saveImage } from "@/lib/storage";

const schema = z.object({
  name: z.string().trim().min(2, "Укажи название спонсора").max(80),
  url: z.string().trim().regex(/^https:\/\/\S+$/, "Ссылка должна начинаться с https://").max(500),
  description: z
    .string()
    .transform((value) => value.replace(/\r\n?/g, "\n").trim())
    .pipe(z.string().max(3000, "Описание — не длиннее 3000 символов")),
  // Пусто — спонсор всей премии.
  nominationId: z.string().max(40),
  order: z.coerce.number().int().min(0).max(99),
});

/** Поля формы спонсора: общие для создания и правки. */
async function readForm(formData: FormData, sponsorId?: string) {
  const parsed = schema.safeParse(Object.fromEntries([...formData].filter(([, value]) => typeof value === "string")));
  if (!parsed.success) return { error: parsed.error.issues.map((issue) => issue.message).join("; ") };
  const links = parseLinks(formData);
  if ("errors" in links) return { error: Object.values(links.errors).join("; ") };
  const { nominationId, description, ...fields } = parsed.data;

  if (nominationId) {
    if (!(await db.nomination.findUnique({ where: { id: nominationId } }))) return { error: "Номинация не найдена." };
    const taken = await db.sponsor.findFirst({ where: { nominationId, id: { not: sponsorId } } });
    if (taken) return { error: `У этой номинации уже есть спонсор: ${taken.name}. Сначала убери его.` };
  }

  let logoUrl: string | undefined;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    const saved = await saveImage(logo);
    if ("error" in saved) return { error: saved.error };
    logoUrl = saved.url;
  }
  return { data: { ...fields, description: description || null, links: links.links, nominationId: nominationId || null, ...(logoUrl && { logoUrl }) } };
}

export async function createSponsor(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requirePermission("ads");
  const form = await readForm(formData);
  if ("error" in form) return failed(form.error!);
  const sponsor = await db.sponsor.create({ data: form.data });
  await audit(context, "sponsor.create", { type: "sponsor", id: sponsor.id }, null, sponsor);
  revalidatePath("/", "layout");
  return done(`Спонсор «${sponsor.name}» добавлен`);
}

export async function updateSponsor(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requirePermission("ads");
  const before = await db.sponsor.findUnique({ where: { id } });
  if (!before) return failed("Спонсор не найден.");
  const form = await readForm(formData, id);
  if ("error" in form) return failed(form.error!);
  const after = await db.sponsor.update({ where: { id }, data: form.data });
  await audit(context, "sponsor.update", { type: "sponsor", id }, before, after);
  revalidatePath("/", "layout");
  return done("Сохранено");
}

export async function deleteSponsor(id: string): Promise<ActionState> {
  const context = await requirePermission("ads");
  const sponsor = await db.sponsor.findUnique({ where: { id } });
  if (!sponsor) return failed("Спонсор не найден.");
  await db.sponsor.delete({ where: { id } });
  await audit(context, "sponsor.delete", { type: "sponsor", id }, sponsor, null);
  revalidatePath("/", "layout");
  return done("Спонсор убран");
}
