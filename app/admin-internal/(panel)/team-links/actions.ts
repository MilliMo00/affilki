"use server";

import { revalidatePath } from "next/cache";
import { done, failed, type ActionState } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { ensureTeamToken } from "@/lib/team";

/** Создать ссылку команды или заменить её новой (старая перестанет работать). */
export async function makeTeamLink(nomineeId: string, regenerate: boolean): Promise<ActionState> {
  const context = await requirePermission("awards");
  if (!(await db.nominee.findUnique({ where: { id: nomineeId } }))) return failed("Участник не найден.");
  await ensureTeamToken(nomineeId, regenerate);
  await audit(context, regenerate ? "team_link.regenerate" : "team_link.create", { type: "nominee", id: nomineeId }, null, null);
  revalidatePath("/", "layout");
  return done(regenerate ? "Новая ссылка готова, старая больше не работает." : "Ссылка готова.");
}

/** Ссылки для всех опубликованных участников, у кого их ещё нет. */
export async function makeAllTeamLinks(): Promise<ActionState> {
  const context = await requirePermission("awards");
  const missing = await db.nominee.findMany({ where: { published: true, teamToken: null }, select: { id: true } });
  for (const nominee of missing) await ensureTeamToken(nominee.id);
  await audit(context, "team_link.create_all", { type: "nominee" }, null, { count: missing.length });
  revalidatePath("/", "layout");
  return done(missing.length ? `Создано ссылок: ${missing.length}.` : "У всех участников ссылки уже есть.");
}
