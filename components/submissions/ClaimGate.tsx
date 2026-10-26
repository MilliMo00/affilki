"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { Loader } from "@/components/brand/Loader";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { voter, useVoter } from "@/lib/voter-store";
import { SubmissionForm, type NominationOption, type SubmissionDraft } from "./SubmissionForm";

type ClaimGateProps = {
  token: string;
  draft: SubmissionDraft;
  nominations: NominationOption[];
  categories: { slug: string; title: string }[];
};

/** Команда проверяет заявку, подготовленную редакцией: вход через бота, анкета, подтверждение или отказ. */
export function ClaimGate({ token, draft, nominations, categories }: ClaimGateProps) {
  const { loaded, user } = useVoter();
  const [declining, setDeclining] = useState(false);
  const [comment, setComment] = useState("");
  const [declined, setDeclined] = useState<"idle" | "pending" | "done" | "error">("idle");

  const decline = async () => {
    setDeclined("pending");
    const res = await fetch(`/api/submissions/claim/${token}/decline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment }),
    }).catch(() => null);
    setDeclined(res?.ok ? "done" : "error");
  };

  if (declined === "done") {
    return (
      <div role="status" className="rounded-card border border-petal/60 bg-deep/40 p-8 text-center">
        <h2 className="text-2xl">Поняли, спасибо</h2>
        <p className="mt-2 text-lg text-text">Заявку отозвали — на сайте её не будет. Если передумаете, подать заявку можно в любой момент.</p>
      </div>
    );
  }

  if (!loaded) return <Loader size={40} />;

  return (
    <div className="space-y-8">
      {user ? (
        <SubmissionForm nominations={nominations} categories={categories} draft={draft} claimToken={token} defaultName={user.name} />
      ) : (
        <div className="rounded-card border border-petal/60 bg-deep/40 p-6 sm:p-8">
          <h2 className="text-xl">Войдите через Telegram</h2>
          <p className="mt-2 text-text">
            Чтобы подтвердить заявку от имени команды, войдите через нашего бота — один раз. Через него же придут ответы редакции и
            ссылка на страницу команды.
          </p>
          <Button size="lg" className="mt-5" onClick={() => voter.openLogin()}>
            <Send size={20} strokeWidth={1.75} aria-hidden />
            Войти через бота
          </Button>
        </div>
      )}

      <div className="border-t border-petal/40 pt-6">
        {declining ? (
          <div className="space-y-3">
            <label htmlFor="decline-comment" className="block font-medium text-paper">
              Почему не хотите участвовать? <span className="font-normal text-muted">необязательно</span>
            </label>
            <textarea id="decline-comment" value={comment} onChange={(event) => setComment(event.target.value)} rows={3} maxLength={1000} className={inputClass} />
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={decline} disabled={declined === "pending"}>
                {declined === "pending" ? "Отправляем…" : "Отказаться от участия"}
              </Button>
              <Button variant="secondary" onClick={() => setDeclining(false)}>
                Отмена
              </Button>
            </div>
            {declined === "error" && (
              <p role="alert" className="text-danger">
                Не получилось — попробуйте ещё раз.
              </p>
            )}
          </div>
        ) : (
          <button type="button" onClick={() => setDeclining(true)} className="text-muted-bright underline underline-offset-4 hover:text-paper">
            Это не про нас / не хотим участвовать
          </button>
        )}
      </div>
    </div>
  );
}
