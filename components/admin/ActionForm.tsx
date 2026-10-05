"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent, type ReactNode } from "react";
import type { ActionState } from "@/lib/admin/action";
import { cn } from "@/lib/cn";

type ActionFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  submit: string;
  /** Опасное действие: красная кнопка и поле для кода из приложения. */
  danger?: boolean;
  /** Требовать свежий код из приложения-аутентификатора. */
  totp?: boolean;
  className?: string;
};

export const adminInput =
  "w-full rounded-card border border-petal/60 bg-deep/40 px-3 py-2 text-base text-paper placeholder:text-muted/70 focus:border-glow";

/** Форма админки поверх серверного действия: показывает результат и состояние отправки. */
export function ActionForm({ action, children, submit, danger, totp, className }: ActionFormProps) {
  const [state, dispatch, pending] = useActionState(action, null);
  const totpRef = useRef<HTMLInputElement>(null);

  // Отправляем сами, а не через action формы: иначе React после каждого ответа сбрасывает поля,
  // и при ошибке (например, неверный код) всё введённое пропадает.
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  };

  // Код одноразовый — после ответа сервера поле очищается.
  useEffect(() => {
    if (state && totpRef.current) totpRef.current.value = "";
  }, [state]);

  return (
    <form onSubmit={onSubmit} className={cn("space-y-4", className)}>
      {children}
      {totp && (
        <label className="block max-w-xs">
          <span className="mb-1 block text-sm font-medium text-paper">Код из приложения-аутентификатора</span>
          <input
            ref={totpRef}
            name="totp"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            maxLength={9}
            placeholder="123456"
            className={adminInput}
          />
        </label>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "h-11 rounded-full px-5 font-semibold transition-colors disabled:opacity-50",
            danger ? "bg-danger text-ink hover:bg-danger/85" : "focus-on-bright bg-paper text-deep hover:bg-text",
          )}
        >
          {pending ? "Выполняем…" : submit}
        </button>
        {state && (
          <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-paper" : "text-danger"}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
