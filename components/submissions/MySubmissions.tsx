"use client";

import { Send } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader } from "@/components/brand/Loader";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { voter, useVoter } from "@/lib/voter-store";
import { SubmissionForm, type SubmissionDraft } from "./SubmissionForm";

type Status = "PENDING" | "CHANGES_REQUESTED" | "APPROVED" | "REJECTED";
type Row = SubmissionDraft & { status: Status; adminComment: string | null; publicUrl: string | null; updatedAt: string };

const STATUS: Record<Status, { label: string; className: string }> = {
  PENDING: { label: "На проверке", className: "border-petal text-muted-bright" },
  CHANGES_REQUESTED: { label: "Нужны правки", className: "border-danger text-danger" },
  APPROVED: { label: "Опубликовано", className: "border-paper text-paper" },
  REJECTED: { label: "Не принято", className: "border-petal/60 text-muted" },
};

const dateFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

type MySubmissionsProps = {
  nominations: { id: string; title: string }[];
  categories: { slug: string; title: string }[];
};

export function MySubmissions({ nominations, categories }: MySubmissionsProps) {
  const { loaded, user } = useVoter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/submissions").catch(() => null);
    setRows(res?.ok ? (await res.json()).submissions : []);
    // Точка в шапке обновится вместе со списком.
    fetch("/api/me")
      .then((r) => r.json())
      .then(voter.setMe)
      .catch(() => {});
  }, []);

  // Зависимость — сам факт входа, а не объект пользователя: load обновляет стор,
  // и при зависимости от объекта получился бы бесконечный цикл запросов.
  const signedIn = !!user;
  useEffect(() => {
    if (!signedIn) return;
    const first = window.setTimeout(load, 0);
    return () => window.clearTimeout(first);
  }, [signedIn, load]);

  if (!loaded) return <Loader size={40} />;

  if (!user) {
    return (
      <div className="rounded-card border border-petal/60 bg-deep/40 p-6 sm:p-8">
        <p className="text-lg text-text">Войди через Telegram, чтобы увидеть свои заявки.</p>
        <Button size="lg" className="mt-5" onClick={() => voter.openLogin()}>
          <Send size={20} strokeWidth={1.75} aria-hidden />
          Войти через бота
        </Button>
      </div>
    );
  }

  if (rows === null) return <Loader size={40} />;

  if (rows.length === 0) {
    return (
      <div className="rounded-card border border-petal/40 px-6 py-14 text-center">
        <p className="text-lg text-text">Заявок пока нет. Подай первую — в номинацию или на статью.</p>
        <Button href="/submit" className="mt-6">
          Подать заявку
        </Button>
      </div>
    );
  }

  return (
    <ul className="space-y-5">
      {rows.map((row) => {
        const status = STATUS[row.status];
        const editable = row.status === "PENDING" || row.status === "CHANGES_REQUESTED";
        return (
          <li key={row.id} className="rounded-card border border-petal/40 bg-deep/30 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted">
                  {row.kind === "NOMINEE" ? "Заявка в номинацию" : "Статья"} · обновлено {dateFmt.format(new Date(row.updatedAt))}
                </p>
                <h2 className="mt-1 font-sans text-xl font-semibold">{row.title}</h2>
              </div>
              <span className={cn("rounded-full border px-3 py-1 text-sm font-medium", status.className)}>{status.label}</span>
            </div>

            {row.adminComment && (row.status === "CHANGES_REQUESTED" || row.status === "REJECTED") && (
              <div className="mt-4 rounded-card border border-petal/60 bg-ink/40 p-4">
                <p className="text-sm font-semibold text-paper">Комментарий редактора</p>
                <p className="mt-1 whitespace-pre-line text-text">{row.adminComment}</p>
              </div>
            )}

            {row.status === "APPROVED" && row.publicUrl && (
              <Link href={row.publicUrl} className="mt-4 inline-block font-medium text-paper underline underline-offset-4">
                Открыть на сайте
              </Link>
            )}

            {editable && editing !== row.id && (
              <Button variant={row.status === "CHANGES_REQUESTED" ? "primary" : "secondary"} className="mt-4" onClick={() => setEditing(row.id)}>
                {row.status === "CHANGES_REQUESTED" ? "Исправить и отправить" : "Изменить заявку"}
              </Button>
            )}

            {editing === row.id && (
              <div className="mt-6 border-t border-petal/30 pt-6">
                <SubmissionForm nominations={nominations} categories={categories} draft={row} onSaved={load} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
