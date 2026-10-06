"use client";

import Image from "next/image";
import { startTransition, useActionState, useRef, useState } from "react";
import { adminInput } from "@/components/admin/styles";
import { Label } from "@/components/admin/ui";
import { cn } from "@/lib/cn";
import { sendBroadcast, sendTest, type BroadcastState } from "./actions";

type BroadcastFormProps = { segments: { key: string; label: string; count: number }[] };

/** Одна форма, две кнопки: сначала пробная отправка себе, потом рассылка всем. */
export function BroadcastForm({ segments }: BroadcastFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [segment, setSegment] = useState(segments[0].key);
  const [state, dispatch, pending] = useActionState(
    async (_: BroadcastState, payload: { mode: "test" | "send"; formData: FormData }) =>
      payload.mode === "test" ? sendTest(null, payload.formData) : sendBroadcast(null, payload.formData),
    null,
  );
  const count = segments.find((s) => s.key === segment)?.count ?? 0;
  // Картинка, уже загруженная при пробной отправке: повторно выбирать файл не нужно.
  const uploaded = state?.imageUrl ?? null;

  const run = (mode: "test" | "send") => {
    const form = formRef.current;
    if (!form || !form.reportValidity()) return;
    if (mode === "send" && !window.confirm(`Отправить сообщение ${count} получателям? Отменить отправленное нельзя.`)) return;
    startTransition(() => dispatch({ mode, formData: new FormData(form) }));
  };

  const button = "h-11 rounded-full px-5 font-semibold transition-colors disabled:opacity-50";

  return (
    <form ref={formRef} onSubmit={(event) => event.preventDefault()} className="space-y-4">
      <Label title="Кому">
        <select name="segment" value={segment} onChange={(event) => setSegment(event.target.value)} className={`${adminInput} max-w-md`}>
          {segments.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label} — {s.count}
            </option>
          ))}
        </select>
      </Label>

      <Label title="Текст" hint="**жирный**, *курсив*, __подчёркнутый__, [текст ссылки](https://адрес). Без картинки — до 4096 символов, с картинкой — до 1024.">
        <textarea name="text" rows={8} required className={adminInput} />
      </Label>

      <Label title="Картинка" hint="Необязательно. PNG, JPG, GIF или WebP до 10 МБ.">
        {uploaded && (
          <span className="mb-3 flex items-center gap-3">
            <span className="relative block h-20 w-32 overflow-hidden rounded-card border border-petal/60">
              <Image src={uploaded} alt="Картинка рассылки" fill sizes="128px" className="object-cover" />
            </span>
            <span className="text-sm text-muted">Уже загружена. Выбери другой файл, чтобы заменить.</span>
          </span>
        )}
        <input type="hidden" name="existingImage" value={uploaded ?? ""} />
        <input type="file" name="image" accept="image/png,image/jpeg,image/gif,image/webp" className="block text-text" />
      </Label>

      <div className="grid gap-4 sm:grid-cols-2">
        <Label title="Кнопка под сообщением" hint="Необязательно">
          <input name="buttonText" maxLength={40} placeholder="Голосовать" className={adminInput} />
        </Label>
        <Label title="Ссылка кнопки">
          <input name="buttonUrl" type="url" placeholder="https://affilki.com/awards" className={adminInput} />
        </Label>
      </div>

      <label className="block max-w-xs">
        <span className="mb-1 block text-sm font-medium text-paper">Код из приложения-аутентификатора</span>
        <input name="totp" inputMode="numeric" autoComplete="one-time-code" maxLength={9} placeholder="нужен только для рассылки" className={adminInput} />
      </label>

      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={pending} onClick={() => run("test")} className={cn(button, "border border-petal text-paper hover:border-glow")}>
          Отправить себе для проверки
        </button>
        <button type="button" disabled={pending} onClick={() => run("send")} className={cn(button, "bg-danger text-ink hover:bg-danger/85")}>
          Разослать: {count}
        </button>
      </div>
      {pending && <p className="text-muted">Выполняем…</p>}
      {state && (
        <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-paper" : "text-danger"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
