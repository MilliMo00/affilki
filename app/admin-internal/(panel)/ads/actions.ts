"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AD_SLOTS } from "@/components/ads/slots";
import { done, failed, stepUp, type ActionState } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { saveImage } from "@/lib/storage";
import { randomToken } from "@/lib/voting/tokens";

// Даты в форме — московские.
const mskDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Укажи даты кампании")
  .transform((value) => new Date(`${value}:00+03:00`));

const schema = z.object({
  slotKey: z.enum(Object.keys(AD_SLOTS) as [string, ...string[]]),
  advertiser: z.string().trim().min(2, "Укажи рекламодателя").max(100),
  targetUrl: z.string().trim().regex(/^https:\/\/\S+$/, "Ссылка должна начинаться с https://").max(500),
  startsAt: mskDate,
  endsAt: mskDate,
});

export async function createCampaign(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requirePermission("ads");
  const parsed = schema.safeParse(Object.fromEntries([...formData].filter(([, v]) => typeof v === "string")));
  if (!parsed.success) return failed(parsed.error.issues.map((i) => i.message).join("; "));
  if (parsed.data.endsAt <= parsed.data.startsAt) return failed("Конец кампании должен быть позже начала.");

  const overlap = await db.adCampaign.findFirst({
    where: { slotKey: parsed.data.slotKey, startsAt: { lt: parsed.data.endsAt }, endsAt: { gt: parsed.data.startsAt } },
  });
  if (overlap) return failed(`На эти даты слот уже занят: ${overlap.advertiser}.`);

  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) return failed("Загрузи картинку или гифку.");
  const saved = await saveImage(image);
  if ("error" in saved) return failed(saved.error);

  let mobileImageUrl: string | null = null;
  const mobile = formData.get("mobileImage");
  if (mobile instanceof File && mobile.size > 0) {
    const savedMobile = await saveImage(mobile);
    if ("error" in savedMobile) return failed(savedMobile.error);
    mobileImageUrl = savedMobile.url;
  }

  const campaign = await db.adCampaign.create({ data: { ...parsed.data, imageUrl: saved.url, mobileImageUrl } });
  await audit(context, "ad.create", { type: "ad_campaign", id: campaign.id }, null, { slotKey: campaign.slotKey, advertiser: campaign.advertiser, startsAt: campaign.startsAt, endsAt: campaign.endsAt });
  revalidatePath("/", "layout");
  return done(`Кампания «${campaign.advertiser}» создана`);
}

export async function deleteCampaign(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requirePermission("ads");
  const denied = await stepUp(context, formData);
  if (denied) return failed(denied);

  const campaign = await db.adCampaign.findUnique({ where: { id } });
  if (!campaign) return failed("Кампания не найдена.");
  await db.adCampaign.delete({ where: { id } });
  await audit(context, "ad.delete", { type: "ad_campaign", id }, { slotKey: campaign.slotKey, advertiser: campaign.advertiser }, null);
  revalidatePath("/", "layout");
  return done("Кампания удалена");
}

/** Ссылка на отчёт только для чтения — её можно отправить рекламодателю. Старая ссылка перестаёт работать. */
export async function createReportLink(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requirePermission("ads");
  const days = z.coerce.number().int().min(1).max(365).safeParse(formData.get("days"));
  if (!days.success) return failed("Срок действия — от 1 до 365 дней.");

  const campaign = await db.adCampaign.findUnique({ where: { id } });
  if (!campaign) return failed("Кампания не найдена.");
  const token = randomToken();
  await db.adCampaign.update({ where: { id }, data: { reportToken: token, reportExpiresAt: new Date(Date.now() + days.data * 86_400_000) } });
  await audit(context, "ad.report_link", { type: "ad_campaign", id }, null, { days: days.data });
  revalidatePath("/", "layout");
  return done(`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/report/${token}`);
}
