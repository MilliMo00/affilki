"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { done, failed, stepUp, type ActionState } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/admin/auth";
import { db } from "@/lib/db";

const reason = z.string().trim().min(3, "Укажи причину").max(300);

/** Аннулирование выбранных голосов: мягкое удаление с причиной, попадает в журнал. */
export async function voidVotes(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requirePermission("votes");
  const ids = formData.getAll("vote").map(String).filter(Boolean);
  if (ids.length === 0) return failed("Не выбрано ни одного голоса.");
  const parsedReason = reason.safeParse(formData.get("reason"));
  if (!parsedReason.success) return failed(parsedReason.error.issues[0].message);

  const denied = await stepUp(context, formData);
  if (denied) return failed(denied);

  const result = await db.vote.updateMany({
    where: { id: { in: ids }, voidedAt: null },
    data: { voidedAt: new Date(), voidReason: parsedReason.data, voidedBy: context.admin.id },
  });
  await audit(context, "votes.void", { type: "vote" }, null, { ids, reason: parsedReason.data, count: result.count });
  revalidatePath("/", "layout");
  return done(`Аннулировано голосов: ${result.count}`);
}

/** Возврат аннулированного голоса — на случай ошибки модератора. */
export async function restoreVote(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requirePermission("votes");
  const denied = await stepUp(context, formData);
  if (denied) return failed(denied);

  const before = await db.vote.findUnique({ where: { id } });
  if (!before?.voidedAt) return failed("Голос не аннулирован.");
  await db.vote.update({ where: { id }, data: { voidedAt: null, voidReason: null, voidedBy: null } });
  await audit(context, "votes.restore", { type: "vote", id }, { voidReason: before.voidReason }, null);
  revalidatePath("/", "layout");
  return done("Голос возвращён");
}

const tgId = z
  .string()
  .trim()
  .regex(/^\d{3,15}$/, "Telegram ID — только цифры");

/** Бан аккаунта: его голоса перестают учитываться, новые он отдать не может. */
export async function banAccount(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requirePermission("votes");
  const parsedId = tgId.safeParse(formData.get("tgUserId"));
  const parsedReason = reason.safeParse(formData.get("reason"));
  if (!parsedId.success) return failed(parsedId.error.issues[0].message);
  if (!parsedReason.success) return failed(parsedReason.error.issues[0].message);

  const denied = await stepUp(context, formData);
  if (denied) return failed(denied);

  const id = BigInt(parsedId.data);
  await db.tgBan.upsert({
    where: { tgUserId: id },
    create: { tgUserId: id, reason: parsedReason.data, createdBy: context.admin.id },
    update: { reason: parsedReason.data },
  });
  // Вход забаненного сбрасывается сразу.
  await db.voterSession.updateMany({ where: { tgUserId: id, revokedAt: null }, data: { revokedAt: new Date() } });
  await audit(context, "ban.create", { type: "tg_account", id: parsedId.data }, null, { reason: parsedReason.data });
  revalidatePath("/", "layout");
  return done(`Аккаунт ${parsedId.data} забанен`);
}

export async function unbanAccount(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requirePermission("votes");
  const denied = await stepUp(context, formData);
  if (denied) return failed(denied);

  const before = await db.tgBan.findUnique({ where: { tgUserId: BigInt(id) } });
  if (!before) return failed("Бан не найден.");
  await db.tgBan.delete({ where: { tgUserId: BigInt(id) } });
  await audit(context, "ban.delete", { type: "tg_account", id }, { reason: before.reason }, null);
  revalidatePath("/", "layout");
  return done("Бан снят");
}

/** Публикация итогов и её отмена. */
export async function setResultsPublished(published: boolean, _: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requirePermission("votes");
  const denied = await stepUp(context, formData);
  if (denied) return failed(denied);

  const season = await db.season.findFirst({ orderBy: { year: "desc" } });
  if (!season) return failed("Сезон не найден.");
  if (published && new Date() < season.votingEndsAt) return failed("Голосование ещё идёт. Итоги публикуются после его окончания.");

  const updated = await db.season.update({
    where: { id: season.id },
    data: { resultsPublished: published, ...(published && { stage: "CEREMONY" as const }) },
  });
  await audit(context, published ? "results.publish" : "results.unpublish", { type: "season", id: season.id }, { resultsPublished: season.resultsPublished }, { resultsPublished: updated.resultsPublished });
  revalidatePath("/", "layout");
  return done(published ? "Итоги опубликованы" : "Публикация итогов отменена");
}
