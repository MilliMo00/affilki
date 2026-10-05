import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { Logo } from "@/components/brand/Logo";
import { getAdmin, getPreAuthAdmin } from "@/lib/admin/auth";
import { decrypt, encrypt, newTotpSecret, totpUri } from "@/lib/admin/crypto";
import { adminUrl } from "@/lib/admin/path";
import { db } from "@/lib/db";
import { SetupForm, VerifyForm } from "./TotpForms";

export default async function TotpPage() {
  if (await getAdmin()) redirect(adminUrl());
  const admin = await getPreAuthAdmin();
  if (!admin) redirect(adminUrl("/login"));

  // Обычный вход: секрет уже настроен.
  if (admin.totpSecretEnc) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 text-center">
        <Logo size={40} rayColor="var(--ink)" />
        <div>
          <h1 className="text-2xl">Код из приложения</h1>
          <p className="mt-2 max-w-sm text-muted">Шаг 2 из 2. Открой приложение-аутентификатор и введи 6 цифр для AFFILKI.</p>
        </div>
        <VerifyForm />
      </main>
    );
  }

  // Первый вход: показываем QR. Секрет хранится зашифрованным и до подтверждения считается черновым.
  let secret = admin.totpPendingEnc ? decrypt(admin.totpPendingEnc) : null;
  if (!secret) {
    secret = newTotpSecret();
    await db.adminUser.update({ where: { id: admin.id }, data: { totpPendingEnc: encrypt(secret) } });
  }
  const qr = await QRCode.toString(totpUri(secret, admin.name), { type: "svg", margin: 1, color: { dark: "#120B3D", light: "#FFFFFF" } });

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10 text-center">
      <Logo size={40} rayColor="var(--ink)" />
      <div>
        <h1 className="text-2xl">Настройка второго шага</h1>
        <p className="mt-2 max-w-md text-muted">
          Установи Google Authenticator или 2FAS, отсканируй код и введи 6 цифр, которые покажет приложение.
        </p>
      </div>
      <div className="size-48 overflow-hidden rounded-card bg-paper p-2 [&>svg]:size-full" role="img" aria-label="QR-код для приложения-аутентификатора" dangerouslySetInnerHTML={{ __html: qr }} />
      <p className="text-sm text-muted">
        Не сканируется? Введи ключ вручную: <span className="break-all font-mono text-paper">{secret}</span>
      </p>
      <SetupForm />
    </main>
  );
}
