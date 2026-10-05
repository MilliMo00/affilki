"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader } from "@/components/brand/Loader";
import { Button } from "@/components/ui/Button";
import { startAdminLogin, type AdminLoginLink } from "./actions";

export function LoginClient({ basePath }: { basePath: string }) {
  const [link, setLink] = useState<AdminLoginLink | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!link || "error" in link) return;
    let timer: number;
    let cancelled = false;
    const poll = async () => {
      const res = await fetch(`${basePath}/api/login-status`).then((r) => r.json()).catch(() => ({ status: "pending" }));
      if (cancelled) return;
      if (res.status === "ok") return router.push(`${basePath}/totp`);
      if (res.status === "rejected" || res.status === "expired") return setProblem("Вход не подтверждён. Начни заново.");
      timer = window.setTimeout(poll, 2000);
    };
    timer = window.setTimeout(poll, 2000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [link, basePath, router]);

  const start = async () => {
    setProblem(null);
    // Старая ссылка уже недействительна — убираем её сразу, а не когда придёт новая.
    setLink(null);
    setLink(await startAdminLogin());
  };

  if (!link || problem || "error" in link) {
    return (
      <div className="flex flex-col items-center gap-4">
        {(problem || (link && "error" in link)) && (
          <p role="alert" className="text-danger">
            {problem ?? (link as { error: string }).error}
          </p>
        )}
        <Button size="lg" onClick={start}>
          <Send size={20} strokeWidth={1.75} aria-hidden />
          Войти через Telegram
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Button href={link.url} size="lg">
        <Send size={20} strokeWidth={1.75} aria-hidden />
        Открыть бота
      </Button>
      <div
        className="size-40 overflow-hidden rounded-card bg-paper p-2 [&>svg]:size-full"
        role="img"
        aria-label="QR-код со ссылкой на бота"
        dangerouslySetInnerHTML={{ __html: link.qr }}
      />
      <p className="flex items-center gap-3 text-muted" role="status">
        <Loader size={24} label="Ждём подтверждения" />
        Ждём подтверждения в боте
      </p>
    </div>
  );
}
