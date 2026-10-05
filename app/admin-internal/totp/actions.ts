"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/admin/action";
import { failed } from "@/lib/admin/action";
import { createAdminSession, getPreAuthAdmin, requestInfo, verifyCode } from "@/lib/admin/auth";
import { decrypt, newBackupCodes } from "@/lib/admin/crypto";
import { adminUrl } from "@/lib/admin/path";
import { db } from "@/lib/db";
import { rateLimiter } from "@/lib/ratelimit";

async function guard() {
  const admin = await getPreAuthAdmin();
  if (!admin) redirect(adminUrl("/login"));
  const info = await requestInfo();
  // 5 попыток за 15 минут — и по IP, и по аккаунту.
  const [byIp, byAdmin] = await Promise.all([
    rateLimiter.hit(`admin-totp:ip:${info.ipHash}`, 5, 15 * 60_000),
    rateLimiter.hit(`admin-totp:id:${admin.id}`, 5, 15 * 60_000),
  ]);
  return { admin, limited: !byIp.ok || !byAdmin.ok };
}

/** Второй фактор при обычном входе. */
export async function verifyLoginCode(_: ActionState, formData: FormData): Promise<ActionState> {
  const { admin, limited } = await guard();
  if (limited) return failed("Слишком много попыток. Подожди 15 минут.");
  if (!admin.totpSecretEnc) redirect(adminUrl("/totp"));

  const result = await verifyCode(admin, formData.get("code"));
  if (!result.ok) return failed(result.error);

  await createAdminSession(admin);
  redirect(adminUrl());
}

export type SetupState = { ok: false; message: string } | { ok: true; codes: string[] } | null;

/** Первая настройка: подтверждаем, что приложение показывает верный код, и выдаём резервные коды. */
export async function confirmSetup(_: SetupState, formData: FormData): Promise<SetupState> {
  const { admin, limited } = await guard();
  if (limited) return { ok: false, message: "Слишком много попыток. Подожди 15 минут." };
  if (admin.totpSecretEnc || !admin.totpPendingEnc) redirect(adminUrl("/totp"));

  const result = await verifyCode(admin, formData.get("code"), decrypt(admin.totpPendingEnc));
  if (!result.ok) return { ok: false, message: result.error };

  const { codes, hashes } = newBackupCodes();
  await db.adminUser.update({
    where: { id: admin.id },
    data: { totpSecretEnc: admin.totpPendingEnc, totpPendingEnc: null, backupCodes: hashes },
  });
  return { ok: true, codes };
}

/** После показа резервных кодов: открываем сессию. */
export async function finishSetup() {
  const admin = await getPreAuthAdmin();
  if (!admin?.totpSecretEnc) redirect(adminUrl("/login"));
  await createAdminSession(admin);
  redirect(adminUrl());
}

