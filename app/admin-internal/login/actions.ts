"use server";

import { cookies } from "next/headers";
import QRCode from "qrcode";
import { ADMIN_LOGIN_COOKIE, cookieBase, requestInfo } from "@/lib/admin/auth";
import { rateLimiter } from "@/lib/ratelimit";
import { LOGIN_TTL_MS, startLogin } from "@/lib/voting/login";

export type AdminLoginLink = { url: string; qr: string } | { error: string };

/** Первый фактор: одноразовая ссылка в бота. Не больше 5 попыток за 15 минут с одного IP. */
export async function startAdminLogin(): Promise<AdminLoginLink> {
  const info = await requestInfo();
  const limit = await rateLimiter.hit(`admin-login:${info.ipHash}`, 5, 15 * 60_000);
  if (!limit.ok) return { error: "Слишком много попыток входа. Подожди 15 минут." };

  const { token, browserSecret } = await startLogin(
    { ipHash: info.ipHash, uaHash: info.uaHash, uaLabel: info.uaLabel },
    new Date(),
    "admin",
  );
  (await cookies()).set(ADMIN_LOGIN_COOKIE, browserSecret, { ...cookieBase, maxAge: LOGIN_TTL_MS / 1000 });

  const url = `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=l_${token}`;
  return { url, qr: await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#120B3D", light: "#FFFFFF" } }) };
}
