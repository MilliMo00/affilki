"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { done, failed, stepUp, type ActionState } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { STAGES } from "@/lib/stages";

// Время в форме — московское: так его вводит и читает владелец.
const mskDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  .transform((value) => new Date(`${value}:00+03:00`));

const schema = z.object({
  title: z.string().trim().min(1).max(120),
  stage: z.enum(STAGES),
  votingStartsAt: mskDate,
  votingEndsAt: mskDate,
  nextStageAt: mskDate.optional(),
  liveEnabled: z.boolean(),
  liveMode: z.enum(["PERCENT", "COUNTS"]),
  liveRefreshSec: z.coerce.number().int().min(5).max(600),
  liveMinVotes: z.coerce.number().int().min(0).max(100_000),
  liveFreezeHours: z.coerce.number().int().min(0).max(720),
  requireChannel: z.boolean(),
  requireUsername: z.boolean(),
  requireAvatar: z.boolean(),
  maxTelegramId: z
    .string()
    .trim()
    .regex(/^\d{0,15}$/, "Порог — только цифры")
    .transform((value) => (value ? BigInt(value) : null)),
});

export async function saveSeason(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requirePermission("season");
  const season = await db.season.findFirst({ orderBy: { year: "desc" } });
  if (!season) return failed("Сезон не найден.");

  const raw = Object.fromEntries(formData);
  const flag = (name: string) => formData.get(name) === "on";
  const parsed = schema.safeParse({
    ...raw,
    nextStageAt: raw.nextStageAt || undefined,
    liveEnabled: flag("liveEnabled"),
    requireChannel: flag("requireChannel"),
    requireUsername: flag("requireUsername"),
    requireAvatar: flag("requireAvatar"),
  });
  if (!parsed.success) return failed(`Проверь поля: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}`);
  if (parsed.data.votingEndsAt <= parsed.data.votingStartsAt) return failed("Конец голосования должен быть позже начала.");

  // Настройки защиты и даты меняют правила игры — нужен свежий код.
  const denied = await stepUp(context, formData);
  if (denied) return failed(denied);

  const data = { ...parsed.data, nextStageAt: parsed.data.nextStageAt ?? null };
  const updated = await db.season.update({ where: { id: season.id }, data });
  await audit(context, "season.update", { type: "season", id: season.id }, season, updated);
  revalidatePath("/", "layout");
  return done("Настройки сезона сохранены");
}
