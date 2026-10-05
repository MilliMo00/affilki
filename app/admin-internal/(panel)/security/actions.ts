"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { done, failed, stepUp, type ActionState } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/admin/auth";
import { db } from "@/lib/db";

const role = z.enum(["OWNER", "EDITOR", "ANALYST"]);

const newAdmin = z.object({
  tgId: z.string().trim().regex(/^\d{3,15}$/, "Telegram ID — только цифры"),
  name: z.string().trim().min(2, "Укажи имя").max(60),
  role,
});

/** Все действия раздела — только владелец и только со свежим кодом. */
async function guard(formData: FormData) {
  const context = await requirePermission("security");
  const denied = await stepUp(context, formData);
  return { context, denied };
}

export async function addAdmin(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = newAdmin.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failed(parsed.error.issues[0].message);
  const { context, denied } = await guard(formData);
  if (denied) return failed(denied);

  const tgId = BigInt(parsed.data.tgId);
  if (await db.adminUser.findUnique({ where: { tgId } })) return failed("Админ с таким Telegram ID уже есть.");
  const created = await db.adminUser.create({ data: { tgId, name: parsed.data.name, role: parsed.data.role } });
  await audit(context, "admin.create", { type: "admin", id: created.id }, null, { name: created.name, role: created.role, tgId: parsed.data.tgId });
  revalidatePath("/", "layout");
  return done(`${created.name} добавлен. При первом входе он настроит приложение-аутентификатор.`);
}

type Change = "role" | "deactivate" | "activate" | "reset2fa";

export async function changeAdmin(id: string, change: Change, _: ActionState, formData: FormData): Promise<ActionState> {
  const { context, denied } = await guard(formData);
  if (denied) return failed(denied);

  const target = await db.adminUser.findUnique({ where: { id } });
  if (!target) return failed("Админ не найден.");

  // Нельзя оставить панель без владельца — в том числе случайно снять роль с себя.
  const losesOwner = target.role === "OWNER" && (change === "deactivate" || (change === "role" && formData.get("role") !== "OWNER"));
  if (losesOwner && (await db.adminUser.count({ where: { role: "OWNER", isActive: true } })) <= 1) {
    return failed("Это единственный владелец. Сначала назначь второго.");
  }

  let data: Parameters<typeof db.adminUser.update>[0]["data"];
  if (change === "role") {
    const parsed = role.safeParse(formData.get("role"));
    if (!parsed.success) return failed("Неизвестная роль.");
    data = { role: parsed.data };
  } else if (change === "reset2fa") {
    data = { totpSecretEnc: null, totpPendingEnc: null, backupCodes: [], lastTotpStep: null, failedAttempts: 0, lockedUntil: null };
  } else {
    data = { isActive: change === "activate" };
  }

  const updated = await db.adminUser.update({ where: { id }, data });
  // Смена прав, отключение и сброс 2FA сразу завершают все сессии этого админа.
  await db.adminSession.updateMany({ where: { adminId: id, revokedAt: null }, data: { revokedAt: new Date() } });
  await audit(context, `admin.${change}`, { type: "admin", id }, { role: target.role, isActive: target.isActive }, { role: updated.role, isActive: updated.isActive });
  revalidatePath("/", "layout");
  return done("Готово. Сессии этого админа завершены.");
}

/** Завершить одну сессию или все (кроме текущей). */
export async function revokeSessions(sessionId: string | null, _: ActionState, formData: FormData): Promise<ActionState> {
  const { context, denied } = await guard(formData);
  if (denied) return failed(denied);

  const result = await db.adminSession.updateMany({
    where: { revokedAt: null, ...(sessionId ? { id: sessionId } : { id: { not: context.session.id } }) },
    data: { revokedAt: new Date() },
  });
  await audit(context, sessionId ? "session.revoke" : "session.revoke_all", { type: "admin_session", id: sessionId }, null, { count: result.count });
  revalidatePath("/", "layout");
  return done(`Завершено сессий: ${result.count}`);
}
