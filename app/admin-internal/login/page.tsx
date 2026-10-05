import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { getAdmin } from "@/lib/admin/auth";
import { adminUrl } from "@/lib/admin/path";
import { LoginClient } from "./LoginClient";

export default async function AdminLoginPage() {
  if (await getAdmin()) redirect(adminUrl());

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 text-center">
      <Logo size={40} rayColor="var(--ink)" />
      <div>
        <h1 className="text-2xl">Вход в панель</h1>
        <p className="mt-2 max-w-sm text-muted">Два шага: подтверждение в Telegram и код из приложения-аутентификатора.</p>
      </div>
      <LoginClient basePath={adminUrl()} />
    </main>
  );
}
