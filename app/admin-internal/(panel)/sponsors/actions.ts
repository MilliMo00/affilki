"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { done, failed, type ActionState } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { saveImage } from "@/lib/storage";

const schema = z.object({
  name: z.string().trim().min(2, "Укажи название спонсора").max(80),
  url: z.string().trim().regex(/^https:\/\/\S+$/, "Ссылка должна начинаться с https://").max(500),
  // Пусто — спонсор всей премии.
  nominationId: z.string().max(40),
  order: z.coerce.number().int().min(0).max(99),
});

export async function createSponsor(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requirePermission("ads");
  const parsed = schema.safeParse(Object.fromEntries([...formData].filter(([, value]) => typeof value === "string")));
  if (!parsed.success) return failed(parsed.error.issues.map((issue) => issue.message).join("; "));
  const { nominationId, ...fields } = parsed.data;

  if (nominationId) {
    if (!(await db.nomination.findUnique({ where: { id: nominationId } }))) return failed("Номинация не найдена.");
    const taken = await db.sponsor.findFirst({ where: { nominationId } });
    if (taken) return failed(`У этой номинации уже есть спонсор: ${taken.name}. Сначала убери его.`);
  }

  let logoUrl: string | null = null;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    const saved = await saveImage(logo);
    if ("error" in saved) return failed(saved.error);
    logoUrl = saved.url;
  }

  const sponsor = await db.sponsor.create({ data: { ...fields, logoUrl, nominationId: nominationId || null } });
  await audit(context, "sponsor.create", { type: "sponsor", id: sponsor.id }, null, sponsor);
  revalidatePath("/", "layout");
  return done(`Спонсор «${sponsor.name}» добавлен`);
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
