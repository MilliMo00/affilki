"use client";

import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { cn } from "@/lib/cn";

export type SubmissionKind = "NOMINEE" | "ARTICLE";

export type SubmissionDraft = {
  id: string;
  kind: SubmissionKind;
  authorName: string;
  contact: string;
  title: string;
  text: string;
  imageUrl: string | null;
  links: string[];
  nominationId: string | null;
  categorySlug: string | null;
};

type SubmissionFormProps = {
  nominations: { id: string; title: string }[];
  categories: { slug: string; title: string }[];
  /** Имя из Telegram — подставляется в новую заявку. */
  defaultName?: string;
  defaultContact?: string;
  /** Правка существующей заявки: тип уже не меняется. */
  draft?: SubmissionDraft;
  onSaved?: () => void;
};

type Errors = Record<string, string>;

const KINDS: { key: SubmissionKind; label: string; hint: string }[] = [
  { key: "NOMINEE", label: "Участие в номинации", hint: "Команда, сервис, канал или событие — в одну из номинаций премии" },
  { key: "ARTICLE", label: "Статья или кейс", hint: "Материал в ленту: кейс, новость, интервью, обзор" },
];

export function SubmissionForm({ nominations, categories, defaultName, defaultContact, draft, onSaved }: SubmissionFormProps) {
  const [kind, setKind] = useState<SubmissionKind>(draft?.kind ?? "NOMINEE");
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("kind", kind);
    if (!formData.get("consent")) {
      setErrors({ consent: "Без согласия заявку отправить нельзя" });
      return;
    }

    setPending(true);
    try {
      const res = await fetch(draft ? `/api/submissions/${draft.id}` : "/api/submissions", { method: "POST", body: formData });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setErrors({});
        setSent(true);
        onSaved?.();
        return;
      }
      const found: Errors = body.errors ?? { form: body.error ?? "Не получилось отправить. Попробуй ещё раз." };
      setErrors(found);
      const first = Object.keys(found).find((key) => key !== "form");
      if (first) form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    } catch {
      setErrors({ form: "Нет связи с сервером. Проверь интернет и попробуй ещё раз." });
    } finally {
      setPending(false);
    }
  };

  if (sent) {
    return (
      <div role="status" className="rounded-card border border-petal/60 bg-deep/40 p-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-indigo text-paper">
          <Check size={28} strokeWidth={1.75} aria-hidden />
        </span>
        <h2 className="mt-5 text-2xl">{draft ? "Заявка отправлена заново" : "Заявка отправлена"}</h2>
        <p className="mt-2 text-lg text-text">Редактор посмотрит её и ответит в боте. Статус виден в разделе «Мои заявки».</p>
        <Button href="/my" className="mt-6">
          Мои заявки
        </Button>
      </div>
    );
  }

  const aria = (key: string, hint?: boolean) => ({
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${key}-error` : hint ? `${key}-hint` : undefined,
  });
  const nominee = kind === "NOMINEE";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {/* Honeypot: люди это поле не видят, боты заполняют. */}
      <div className="hidden" aria-hidden>
        <label>
          Сайт
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {!draft && (
        <fieldset>
          <legend className="mb-2 font-medium text-paper">Что подаёшь</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {KINDS.map((option) => (
              <label
                key={option.key}
                className={cn(
                  "cursor-pointer rounded-card border p-4 transition-colors",
                  kind === option.key ? "border-paper bg-deep/60" : "border-petal/60 hover:border-petal",
                )}
              >
                <input type="radio" name="kindChoice" className="sr-only" checked={kind === option.key} onChange={() => setKind(option.key)} />
                <span className="block font-semibold text-paper">{option.label}</span>
                <span className="mt-1 block text-sm text-muted">{option.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {nominee ? (
        <Field id="nominationId" label="Номинация" error={errors.nominationId}>
          <select id="nominationId" name="nominationId" defaultValue={draft?.nominationId ?? ""} className={inputClass} {...aria("nominationId")}>
            <option value="" disabled>
              Выбери номинацию
            </option>
            {nominations.map((nomination) => (
              <option key={nomination.id} value={nomination.id}>
                {nomination.title}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <Field id="categorySlug" label="Рубрика" error={errors.categorySlug}>
          <select id="categorySlug" name="categorySlug" defaultValue={draft?.categorySlug ?? categories[0]?.slug} className={inputClass} {...aria("categorySlug")}>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.title}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="authorName" label="Имя или команда" error={errors.authorName}>
          <input id="authorName" name="authorName" defaultValue={draft?.authorName ?? defaultName} className={inputClass} {...aria("authorName")} />
        </Field>
        <Field id="contact" label="Контакт для связи" hint="Telegram, почта — куда писать по заявке" error={errors.contact}>
          <input id="contact" name="contact" defaultValue={draft?.contact ?? defaultContact} className={inputClass} {...aria("contact", true)} />
        </Field>
      </div>

      <Field id="title" label={nominee ? "Название участника" : "Заголовок"} hint={nominee ? "Так он будет называться на сайте" : undefined} error={errors.title}>
        <input id="title" name="title" defaultValue={draft?.title} className={inputClass} {...aria("title", nominee)} />
      </Field>

      <Field
        id="text"
        label={nominee ? "Расскажи об участнике" : "Текст"}
        hint={
          nominee
            ? "Чем занимаетесь, что сделали за год, почему подходите под номинацию"
            : "Абзацы разделяй пустой строкой. ## Заголовок, - пункт списка, **жирный**, [текст](https://ссылка)"
        }
        error={errors.text}
      >
        <textarea id="text" name="text" rows={nominee ? 7 : 14} defaultValue={draft?.text} className={inputClass} {...aria("text", true)} />
      </Field>

      <Field
        id="image"
        label={nominee ? "Логотип или фото" : "Обложка"}
        optional
        hint={draft?.imageUrl ? "PNG, JPG, GIF или WebP до 10 МБ. Пусто — оставить текущую." : "PNG, JPG, GIF или WebP до 10 МБ"}
        error={errors.image}
      >
        {draft?.imageUrl && (
          <span className="relative mb-3 block h-24 w-40 overflow-hidden rounded-card border border-petal/60">
            <Image src={draft.imageUrl} alt="Текущая картинка заявки" fill sizes="160px" className="object-cover" />
          </span>
        )}
        <input id="image" name="image" type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="block w-full text-text" {...aria("image", true)} />
      </Field>

      <Field id="links" label="Ссылки" optional hint="По одной в строке: сайт, Telegram-канал, соцсети. Начинаются с https://" error={errors.links}>
        <textarea id="links" name="links" rows={3} defaultValue={draft?.links.join("\n")} placeholder="https://" className={inputClass} {...aria("links", true)} />
      </Field>

      <div>
        <label className="flex items-start gap-3">
          <input type="checkbox" name="consent" defaultChecked={!!draft} className="mt-1 size-5 shrink-0 accent-[#7B62F0]" {...aria("consent")} />
          <span>
            Согласен на обработку данных по{" "}
            <Link href="/privacy" className="text-paper underline decoration-glow underline-offset-4">
              политике конфиденциальности
            </Link>
          </span>
        </label>
        {errors.consent && (
          <p id="consent-error" className="mt-2 text-sm text-danger">
            {errors.consent}
          </p>
        )}
      </div>

      {errors.form && (
        <p role="alert" className="text-danger">
          {errors.form}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
        {pending ? "Отправляем…" : draft ? "Отправить заново" : "Отправить заявку"}
      </Button>
    </form>
  );
}
