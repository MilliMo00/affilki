"use client";

import { useActionState } from "react";
import { adminInput } from "@/components/admin/ActionForm";
import { Button } from "@/components/ui/Button";
import { confirmSetup, finishSetup, verifyLoginCode } from "./actions";

function CodeInput({ placeholder = "123456" }: { placeholder?: string }) {
  return (
    <input
      name="code"
      autoFocus
      required
      inputMode="text"
      autoComplete="one-time-code"
      maxLength={9}
      placeholder={placeholder}
      aria-label="Код"
      className={`${adminInput} text-center font-display text-2xl tracking-widest`}
    />
  );
}

export function VerifyForm() {
  const [state, action, pending] = useActionState(verifyLoginCode, null);
  return (
    <form action={action} className="flex w-full max-w-xs flex-col gap-4">
      <CodeInput />
      {state && !state.ok && (
        <p role="alert" className="text-danger">
          {state.message}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Проверяем…" : "Войти"}
      </Button>
      <p className="text-sm text-muted">Нет доступа к приложению? Введи резервный код вида xxxx-xxxx.</p>
    </form>
  );
}

export function SetupForm() {
  const [state, action, pending] = useActionState(confirmSetup, null);

  if (state?.ok) {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-5">
        <h2 className="text-xl">Резервные коды</h2>
        <p className="text-text">
          Сохрани их сейчас — больше мы их не покажем. Каждый код работает один раз, если под рукой нет приложения.
        </p>
        <ul className="grid w-full grid-cols-2 gap-2 rounded-card border border-petal/60 bg-deep/40 p-4 font-mono text-lg text-paper">
          {state.codes.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ul>
        <form action={finishSetup}>
          <Button type="submit" size="lg">
            Я сохранил коды, войти
          </Button>
        </form>
      </div>
    );
  }

  return (
    <form action={action} className="flex w-full max-w-xs flex-col gap-4">
      <CodeInput />
      {state && !state.ok && (
        <p role="alert" className="text-danger">
          {state.message}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Проверяем…" : "Подтвердить"}
      </Button>
    </form>
  );
}
