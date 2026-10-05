"use client";

import { Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader } from "@/components/brand/Loader";
import { Button } from "@/components/ui/Button";
import { voter, useVoter, type VoteTarget } from "@/lib/voter-store";
import { Turnstile } from "./Turnstile";

type LoginLink = { url: string; qr: string; devToken?: string };

/** Шаг 1: вход через бота. Показывает ссылку и QR и ждёт подтверждения. */
function LoginStep() {
  const [link, setLink] = useState<LoginLink | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const poll = async () => {
      const res = await fetch("/api/auth/status").then((r) => r.json()).catch(() => ({ status: "pending" }));
      if (cancelled) return;
      if (res.status === "ok" && res.me) return voter.setMe(res.me);
      if (res.status === "rejected") return setProblem("Вход отменён в боте.");
      if (res.status === "expired") return setProblem("Ссылка устарела.");
      timer = window.setTimeout(poll, 2000);
    };

    fetch("/api/auth/start", { method: "POST" })
      .then(async (res) => {
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) return setProblem(body.error ?? "Не получилось создать ссылку.");
        setLink(body);
        timer = window.setTimeout(poll, 2000);
      })
      .catch(() => !cancelled && setProblem("Нет связи с сервером."));

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [attempt]);

  if (problem) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p role="alert" className="text-lg text-paper">
          {problem}
        </p>
        <Button
          onClick={() => {
            setProblem(null);
            setLink(null);
            setAttempt((n) => n + 1);
          }}
        >
          Попробовать ещё раз
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h2 className="text-xl">Подтверди вход в Telegram</h2>
      <p className="text-muted-bright">
        Голос привязан к Telegram-аккаунту: один аккаунт — один голос в номинации. Регистрация нужна один раз — дальше голосуешь
        прямо на сайте, в каждой номинации.
      </p>
      {link ? (
        <>
          <Button href={link.url} size="lg" className="w-full">
            <Send size={20} strokeWidth={1.75} aria-hidden />
            Открыть бота
          </Button>
          <div className="hidden flex-col items-center gap-2 md:flex">
            <p className="text-sm text-muted-bright">или наведи камеру телефона</p>
            <div
              className="size-40 overflow-hidden rounded-card bg-paper p-2 [&>svg]:size-full"
              role="img"
              aria-label="QR-код со ссылкой на бота"
              dangerouslySetInnerHTML={{ __html: link.qr }}
            />
          </div>
          <p className="flex items-center gap-3 text-muted-bright" role="status">
            <Loader size={24} label="Ждём подтверждения" />
            Ждём подтверждения в боте
          </p>
          {link.devToken && (
            <button
              type="button"
              className="text-sm text-muted-bright underline"
              onClick={() =>
                fetch("/api/dev/bot", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ token: link.devToken }),
                })
              }
            >
              Dev: пройти бота тестовым аккаунтом
            </button>
          )}
        </>
      ) : (
        <Loader size={40} label="Создаём ссылку" />
      )}
    </div>
  );
}

/** Шаг 2: подтверждение голоса с капчей. */
function ConfirmStep({ target, channelUrl }: { target: VoteTarget; channelUrl: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  const resetCaptcha = useCallback(() => {
    setToken(null);
    setCaptchaKey((n) => n + 1);
  }, []);

  const submit = async () => {
    if (!token) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomineeSlug: target.nominee.slug, captchaToken: token }),
      });
      const body = await res.json();
      if (res.ok && body.ok) return voter.voted(body.votes, target.nominee.slug);
      if (res.status === 401) return voter.setMe({ user: null, votes: {} });
      setError({ code: body.error ?? "unknown", message: body.message ?? "Не получилось отдать голос." });
      // Токен капчи одноразовый — для новой попытки нужен новый.
      resetCaptcha();
    } catch {
      setError({ code: "network", message: "Нет связи с сервером. Попробуй ещё раз." });
      resetCaptcha();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h2 className="text-xl">Голосуешь за «{target.nominee.name}»</h2>
      <p className="text-muted-bright">
        Номинация «{target.nomination.title}». <strong className="font-semibold text-paper">Голос нельзя будет изменить.</strong>
      </p>

      <Turnstile
        key={captchaKey}
        onToken={setToken}
        onError={() => setError({ code: "captcha", message: "Проверка не загрузилась. Обнови страницу." })}
      />

      {error && (
        <p role="alert" className="text-danger">
          {error.message}
        </p>
      )}
      {error?.code === "not_subscribed" && (
        <Button href={channelUrl} variant="secondary" className="w-full">
          <Send size={18} strokeWidth={1.75} aria-hidden />
          Подписаться на канал
        </Button>
      )}

      <Button size="lg" className="w-full" disabled={!token || pending} onClick={submit}>
        {pending ? "Записываем голос…" : error?.code === "not_subscribed" ? "Я подписался, проверить" : "Отдать голос"}
      </Button>
    </div>
  );
}

export function VoteDialog({ channelUrl }: { channelUrl: string }) {
  const { target, user } = useVoter();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (target && !dialog.open) dialog.showModal();
    if (!target && dialog.open) dialog.close();
  }, [target]);

  return (
    <dialog
      ref={ref}
      onClose={voter.close}
      onClick={(e) => e.target === ref.current && voter.close()}
      className="m-auto w-[calc(100%-1rem)] max-w-md rounded-petal border border-petal bg-deep p-0 text-text backdrop:bg-ink/80"
    >
      {target && (
        <div className="relative p-4 pt-12 sm:p-8 sm:pt-12">
          <button
            type="button"
            aria-label="Закрыть"
            onClick={voter.close}
            className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full text-muted-bright hover:bg-paper/10 hover:text-paper"
          >
            <X size={20} strokeWidth={1.75} aria-hidden />
          </button>
          {user ? <ConfirmStep target={target} channelUrl={channelUrl} /> : <LoginStep />}
        </div>
      )}
    </dialog>
  );
}
