import type { AdminRole, AdminSession, AdminUser } from "@prisma/client";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { countryOf } from "@/lib/analytics/geo";
import { db } from "@/lib/db";
import { hashValue } from "@/lib/request";
import { telegram } from "@/lib/telegram/client";
import { randomToken, sha256, uaLabel } from "@/lib/voting/tokens";
import { decrypt, sign, unsign, verifySecret, verifyTotp } from "./crypto";
import { adminUrl } from "./path";

const PROD = process.env.NODE_ENV === "production";
export const ADMIN_COOKIE = PROD ? "__Host-aff_admin" : "aff_admin";
export const PRE_COOKIE = PROD ? "__Host-aff_admin_pre" : "aff_admin_pre";
export const ADMIN_LOGIN_COOKIE = PROD ? "__Host-aff_admin_login" : "aff_admin_login";

const SESSION_MS = 8 * 60 * 60 * 1000;
const IDLE_MS = 30 * 60 * 1000;
const PRE_MS = 10 * 60 * 1000;
const LOCK_MS = 60 * 60 * 1000;
const MAX_FAILURES = 10;

// SameSite=Strict: cookie админа не уходит ни с одним запросом с чужого сайта.
export const cookieBase = { httpOnly: true, secure: PROD, sameSite: "strict" as const, path: "/" };

// ── Права ──────────────────────────────────────────────────────────────────

export type Permission = "content" | "awards" | "ads" | "stats" | "votes" | "season" | "security" | "broadcast";

const PERMISSIONS: Record<AdminRole, Permission[]> = {
  OWNER: ["content", "awards", "ads", "stats", "votes", "season", "security", "broadcast"],
  EDITOR: ["content", "awards", "ads"],
  ANALYST: ["stats"],
};

export const can = (role: AdminRole, permission: Permission) => PERMISSIONS[role].includes(permission);

// ── Запрос ─────────────────────────────────────────────────────────────────

export async function requestInfo() {
  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return { ip, ipHash: hashValue(ip), uaHash: hashValue(ua), uaLabel: uaLabel(ua) };
}

// ── Сессия ─────────────────────────────────────────────────────────────────

export type AdminContext = { admin: AdminUser; session: AdminSession; ipHash: string };

/** Действующая сессия админа или null. Проверяется на сервере при каждом запросе. */
export const getAdmin = cache(async (): Promise<AdminContext | null> => {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  const session = await db.adminSession.findUnique({ where: { id: sha256(token) }, include: { admin: true } });
  const now = Date.now();
  if (!session || session.revokedAt || !session.admin.isActive) return null;
  if (session.expiresAt.getTime() <= now || now - session.lastSeenAt.getTime() > IDLE_MS) return null;

  const info = await requestInfo();
  // Сессия привязана к браузеру: другой User-Agent — значит, cookie унесли.
  if (session.uaHash !== info.uaHash) {
    await db.adminSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    return null;
  }
  if (now - session.lastSeenAt.getTime() > 60_000) {
    await db.adminSession.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
  }
  return { admin: session.admin, session, ipHash: info.ipHash };
});

/** Для страниц и действий: без сессии — на вход, без права — 404. Вызывается в каждом обработчике. */
export async function requirePermission(permission?: Permission): Promise<AdminContext> {
  const context = await getAdmin();
  if (!context) redirect(adminUrl("/login"));
  if (permission && !can(context.admin.role, permission)) notFound();
  return context;
}

export async function createAdminSession(admin: AdminUser) {
  const info = await requestInfo();
  const token = randomToken();
  const country = await countryOf(info.ip);
  await db.adminSession.create({
    data: {
      id: sha256(token),
      adminId: admin.id,
      uaHash: info.uaHash,
      ipHash: info.ipHash,
      uaLabel: info.uaLabel,
      country,
      expiresAt: new Date(Date.now() + SESSION_MS),
    },
  });
  await db.adminUser.update({ where: { id: admin.id }, data: { failedAttempts: 0, lockedUntil: null } });

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, { ...cookieBase, maxAge: SESSION_MS / 1000 });
  jar.delete(PRE_COOKIE);

  await notifyOwner(`Вход в админку: ${admin.name} (${admin.role})\n${info.uaLabel}${country ? `, ${country}` : ""}`);
}

export async function notifyOwner(text: string) {
  const owner = Number(process.env.OWNER_TG_ID);
  if (owner) await telegram.sendMessage(owner, text).catch(() => {});
}

// ── Между первым и вторым фактором ─────────────────────────────────────────

export async function setPreAuth(adminId: string) {
  (await cookies()).set(PRE_COOKIE, sign(`${adminId}:${Date.now() + PRE_MS}`), { ...cookieBase, maxAge: PRE_MS / 1000 });
}

/** Админ, прошедший первый фактор (Telegram) и ещё не прошедший второй. */
export async function getPreAuthAdmin() {
  const value = unsign((await cookies()).get(PRE_COOKIE)?.value);
  if (!value) return null;
  const [adminId, expires] = value.split(":");
  if (Number(expires) < Date.now()) return null;
  const admin = await db.adminUser.findUnique({ where: { id: adminId } });
  return admin?.isActive ? admin : null;
}

// ── Второй фактор ──────────────────────────────────────────────────────────

export type CodeResult = { ok: true } | { ok: false; error: string };

/**
 * Проверяет код из приложения (или резервный код) для админа.
 * Используется и при входе, и как повторное подтверждение опасных действий.
 */
export async function verifyCode(admin: AdminUser, rawCode: unknown, secretOverride?: string): Promise<CodeResult> {
  const code = String(rawCode ?? "").trim().toLowerCase();
  const fresh = await db.adminUser.findUniqueOrThrow({ where: { id: admin.id } });

  if (fresh.lockedUntil && fresh.lockedUntil > new Date()) {
    return { ok: false, error: "Слишком много неверных кодов. Вход заблокирован на час." };
  }

  const secret = secretOverride ?? (fresh.totpSecretEnc ? decrypt(fresh.totpSecretEnc) : null);
  const step = secret ? verifyTotp(secret, code) : null;
  // Один и тот же код второй раз не принимается, даже в пределах его 30 секунд.
  if (step !== null && (fresh.lastTotpStep === null || step > fresh.lastTotpStep)) {
    await db.adminUser.update({ where: { id: admin.id }, data: { lastTotpStep: step, failedAttempts: 0 } });
    return { ok: true };
  }

  // Резервный код — одноразовый: после использования его хэш удаляется.
  const hashes = Array.isArray(fresh.backupCodes) ? (fresh.backupCodes as string[]) : [];
  const used = /^[a-z0-9]{4}-[a-z0-9]{4}$/.test(code) ? hashes.findIndex((hash) => verifySecret(code, hash)) : -1;
  if (used !== -1) {
    await db.adminUser.update({
      where: { id: admin.id },
      data: { backupCodes: hashes.filter((_, i) => i !== used), failedAttempts: 0 },
    });
    await notifyOwner(`Использован резервный код: ${admin.name}. Осталось: ${hashes.length - 1}.`);
    return { ok: true };
  }

  const failures = fresh.failedAttempts + 1;
  const locked = failures >= MAX_FAILURES;
  await db.adminUser.update({
    where: { id: admin.id },
    data: { failedAttempts: locked ? 0 : failures, lockedUntil: locked ? new Date(Date.now() + LOCK_MS) : undefined },
  });
  if (locked) await notifyOwner(`Блокировка на час: ${admin.name} — 10 неверных кодов подряд.`);
  return { ok: false, error: "Неверный код." };
}
