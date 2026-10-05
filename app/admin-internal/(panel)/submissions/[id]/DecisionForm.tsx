"use client";

import { startTransition, useActionState, useRef, type ReactNode } from "react";
import { adminInput } from "@/components/admin/ActionForm";
import { Card, Label } from "@/components/admin/ui";
import { cn } from "@/lib/cn";
import { decideSubmission } from "../actions";

type Decision = "save" | "approve" | "return" | "reject";

type DecisionFormProps = { id: string; nominee: boolean; legal: boolean; children: ReactNode };

/** Одна форма с содержанием заявки и четырьмя решениями: кнопка определяет, что сделать с введённым. */
export function DecisionForm({ id, nominee, legal, children }: DecisionFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  // Одно состояние на все решения: показываем результат последнего.
  const [state, dispatch, pending] = useActionState(
    async (_: Awaited<ReturnType<typeof decideSubmission>>, payload: { decision: Decision; formData: FormData }) =>
      decideSubmission(id, payload.decision, null, payload.formData),
    null,
  );

  const run = (decision: Decision) => {
    const form = formRef.current;
    if (!form || !form.reportValidity()) return;
    startTransition(() => dispatch({ decision, formData: new FormData(form) }));
  };

  const button = "h-11 rounded-full px-5 font-semibold transition-colors disabled:opacity-50";

  return (
    <form ref={formRef} onSubmit={(event) => event.preventDefault()} className="space-y-6">
      {children}

      <Card title="Решение" className="max-w-3xl">
        <div className="space-y-4">
          {nominee && legal && (
            <p className="rounded-card border border-petal/60 p-3 text-text">
              Это номинация событий. После одобрения карточка будет создана, но на сайте появится только когда ты отметишь
              «Проверено» в карточке участника.
            </p>
          )}
          <Label title="Комментарий автору" hint="Обязателен для возврата и отказа. Автор увидит его в боте и в «Моих заявках».">
            <textarea name="adminComment" rows={3} className={adminInput} />
          </Label>
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={pending} onClick={() => run("approve")} className={cn(button, "focus-on-bright bg-paper text-deep hover:bg-text")}>
              Одобрить и опубликовать
            </button>
            <button type="button" disabled={pending} onClick={() => run("return")} className={cn(button, "border border-petal text-paper hover:border-glow")}>
              Вернуть с правками
            </button>
            <button type="button" disabled={pending} onClick={() => run("save")} className={cn(button, "border border-petal text-paper hover:border-glow")}>
              Только сохранить правки
            </button>
            <button type="button" disabled={pending} onClick={() => run("reject")} className={cn(button, "bg-danger text-ink hover:bg-danger/85")}>
              Отклонить
            </button>
          </div>
          {pending && <p className="text-muted">Выполняем…</p>}
          {state && (
            <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-paper" : "text-danger"}>
              {state.message}
            </p>
          )}
        </div>
      </Card>
    </form>
  );
}
