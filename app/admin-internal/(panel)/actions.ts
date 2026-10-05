"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, getAdmin } from "@/lib/admin/auth";
import { adminUrl } from "@/lib/admin/path";
import { db } from "@/lib/db";

export async function logout() {
  const context = await getAdmin();
  if (context) await db.adminSession.update({ where: { id: context.session.id }, data: { revokedAt: new Date() } });
  (await cookies()).delete(ADMIN_COOKIE);
  redirect(adminUrl("/login"));
}
