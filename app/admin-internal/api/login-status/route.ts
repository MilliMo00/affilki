import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_LOGIN_COOKIE, setPreAuth } from "@/lib/admin/auth";
import { claimAdminLogin } from "@/lib/voting/login";

/** Страница входа опрашивает этот адрес, пока админ подтверждает вход в боте. */
export async function GET(request: NextRequest) {
  const secret = request.cookies.get(ADMIN_LOGIN_COOKIE)?.value;
  if (!secret) return NextResponse.json({ status: "expired" });

  const result = await claimAdminLogin(secret);
  if (result.status === "ok") await setPreAuth(result.adminId);
  return NextResponse.json({ status: result.status });
}
