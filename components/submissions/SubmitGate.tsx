"use client";

import { Send } from "lucide-react";
import { Loader } from "@/components/brand/Loader";
import { Button } from "@/components/ui/Button";
import { voter, useVoter } from "@/lib/voter-store";
import { SubmissionForm, type NominationOption } from "./SubmissionForm";

type SubmitGateProps = {
  nominations: NominationOption[];
  categories: { slug: string; title: string }[];
};

/** Форма заявки доступна после входа через бота: автору потом приходят ответы редактора. */
export function SubmitGate({ nominations, categories }: SubmitGateProps) {
  const { loaded, user } = useVoter();

  if (!loaded) return <Loader size={40} />;

  if (!user) {
    return (
      <div className="rounded-card border border-petal/60 bg-deep/40 p-6 sm:p-8">
        <h2 className="text-xl">Сначала войди через Telegram</h2>
        <p className="mt-2 text-text">
          Так редактор сможет ответить тебе в боте: заявка принята, нужны правки или материал опубликован. Вход — один раз,
          через нашего бота.
        </p>
        <Button size="lg" className="mt-5" onClick={() => voter.openLogin()}>
          <Send size={20} strokeWidth={1.75} aria-hidden />
          Войти через бота
        </Button>
      </div>
    );
  }

  return (
    <SubmissionForm
      nominations={nominations}
      categories={categories}
      defaultName={user.name}
      defaultContact={user.username ? `@${user.username}` : ""}
    />
  );
}
