"use client";

import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { FIRST_YEAR, type LinkButton, type NomineeDetails } from "@/lib/profile";
import { CasesEditor, LinksEditor } from "./ListEditors";

export type SubmissionKind = "NOMINEE" | "ARTICLE";

export type SubmissionDraft = {
  id: string;
  kind: SubmissionKind;
  authorName: string;
  contact: string;
  title: string;
  text: string;
  imageUrl: string | null;
  links: LinkButton[];
  details: NomineeDetails | null;
  nominationId: string | null;
  categorySlug: string | null;
};

/** isEvents — номинация-события: там описывают событие, а не команду. */
export type NominationOption = { id: string; title: string; isEvents?: boolean };

type SubmissionFormProps = {
  nominations: NominationOption[];
  categories: { slug: string; title: string }[];
  /** Имя из Telegram — подставляется в новую заявку. */
  defaultName?: string;
  defaultContact?: string;
  /** Правка существующей заявки: тип уже не меняется. */
  draft?: SubmissionDraft;
  onSaved?: () => void;
};

type Errors = Record<string, string>;

// Сервер принимает запрос до 25 МБ: проверяем общий размер картинок заранее, чтобы не терять заполненную форму.
const MAX_TOTAL_UPLOAD = 24 * 1024 * 1024;

/** Заголовок блока формы: поля заявки в номинацию разбиты на смысловые части. */
function Section({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <section className="space-y-6 border-t border-petal/40 pt-6">
      <div>
        <h2 className="font-sans text-xl font-semibold text-paper">{title}</h2>
        {lead && <p className="mt-1 text-muted">{lead}</p>}
      </div>
      {children}
    </section>
  );
}

const KINDS: { key: SubmissionKind; label: string; hint: string }[] = [
  { key: "NOMINEE", label: "Участие в номинации", hint: "Команда, сервис, канал или событие — в одну из номинаций премии" },
  { key: "ARTICLE", label: "Статья или кейс", hint: "Материал в ленту: кейс, новость, интервью, обзор" },
];

export function SubmissionForm({ nominations, categories, defaultName, defaultContact, draft, onSaved }: SubmissionFormProps) {
  const [kind, setKind] = useState<SubmissionKind>(draft?.kind ?? "NOMINEE");
  const [nominationId, setNominationId] = useState(draft?.nominationId ?? "");
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
    const uploadSize = [...formData.values()].reduce((sum, value) => sum + (value instanceof File ? value.size : 0), 0);
    if (uploadSize > MAX_TOTAL_UPLOAD) {
      setErrors({ form: "Картинки вместе весят больше 24 МБ. Сожми их или убери часть — остальное можно добавить позже в «Моих заявках»." });
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
      if (first) (form.querySelector<HTMLElement>(`[name="${first}"]`) ?? form.querySelector<HTMLElement>(`[data-field="${first}"] input`))?.focus();
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
  // Номинация-события: года основания, достижений и кейсов у события нет.
  const events = nominee && !!nominations.find((nomination) => nomination.id === nominationId)?.isEvents;
  const team = nominee && !events;
  const details = draft?.details;
  const thisYear = new Date().getFullYear();

  const imageField = (label: string) => (
      <Field
        id="image"
        label={label}
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
  );

  // В заявке в номинацию у ссылок свой блок с заголовком — вторая подпись там не нужна.
  const linksField = (
    <div data-field="links">
      {!nominee && (
        <p className="mb-2 font-medium text-paper">
          Ссылки<span className="ml-2 font-normal text-muted">необязательно</span>
        </p>
      )}
      <LinksEditor initial={draft?.links} inputClass={inputClass} invalid={!!errors.links} />
      {errors.links ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {errors.links}
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted">
          {nominee
            ? "Каждая ссылка станет кнопкой на странице участника — с тем названием, которое ты укажешь. Адрес начинается с https://"
            : "Сайт, Telegram-канал, соцсети. Адрес начинается с https://"}
        </p>
      )}
    </div>
  );

  return (
    <form
      onSubmit={onSubmit}
      onInput={(event) => {
        // Ошибка под полем гаснет, как только его начали исправлять.
        const name = (event.target as HTMLInputElement).name;
        if (name && errors[name]) setErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== name)));
      }}
      noValidate
      className="space-y-6"
    >
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
        <fieldset aria-describedby={errors.nominationId ? "nominationId-error" : undefined}>
          <legend className="mb-2 font-medium text-paper">Номинация</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {nominations.map((nomination) => (
              <label
                key={nomination.id}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-3 rounded-card border px-4 py-2.5 transition-colors has-[:focus-visible]:border-glow",
                  nominationId === nomination.id ? "border-paper bg-deep/60 text-paper" : "border-petal/60 text-text hover:border-petal",
                )}
              >
                <input
                  type="radio"
                  name="nominationId"
                  value={nomination.id}
                  checked={nominationId === nomination.id}
                  onChange={() => setNominationId(nomination.id)}
                  className="size-5 shrink-0 accent-[#7B62F0]"
                />
                <span className="font-medium">{nomination.title}</span>
              </label>
            ))}
          </div>
          {errors.nominationId && (
            <p id="nominationId-error" role="alert" className="mt-2 text-sm text-danger">
              {errors.nominationId}
            </p>
          )}
        </fieldset>
      ) : (
        <fieldset>
          <legend className="mb-2 font-medium text-paper">Рубрика</legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <label
                key={category.slug}
                className="flex h-11 cursor-pointer items-center rounded-full border border-petal/60 px-4 font-medium text-text transition-colors hover:border-petal has-[:checked]:border-paper has-[:checked]:bg-deep/60 has-[:checked]:text-paper has-[:focus-visible]:border-glow"
              >
                <input
                  type="radio"
                  name="categorySlug"
                  value={category.slug}
                  defaultChecked={draft?.categorySlug ? draft.categorySlug === category.slug : index === 0}
                  className="sr-only"
                />
                {category.title}
              </label>
            ))}
          </div>
          {errors.categorySlug && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {errors.categorySlug}
            </p>
          )}
        </fieldset>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="authorName" label="Имя или команда" error={errors.authorName}>
          <input id="authorName" name="authorName" defaultValue={draft?.authorName ?? defaultName} className={inputClass} {...aria("authorName")} />
        </Field>
        <Field id="contact" label="Контакт для связи" hint="Telegram, почта — куда писать по заявке" error={errors.contact}>
          <input id="contact" name="contact" defaultValue={draft?.contact ?? defaultContact} className={inputClass} {...aria("contact", true)} />
        </Field>
      </div>

      {nominee ? (
        <>
          <Section title={events ? "Событие" : "Об участнике"} lead={events ? "Нейтрально и по фактам, без оценок и обвинений." : "Как участник будет называться и выглядеть на сайте."}>
            <div className={cn("grid gap-6", team && "sm:grid-cols-[minmax(0,1fr)_17rem]")}>
              <Field id="title" label={events ? "Название события" : "Название"} hint="Так оно будет написано на сайте" error={errors.title}>
                <input id="title" name="title" defaultValue={draft?.title} className={inputClass} {...aria("title", true)} />
              </Field>
              {team && (
                <Field id="foundedYear" label="Год основания" optional error={errors.foundedYear}>
                  <input
                    id="foundedYear"
                    name="foundedYear"
                    type="number"
                    inputMode="numeric"
                    min={FIRST_YEAR}
                    max={thisYear}
                    defaultValue={details?.foundedYear ?? ""}
                    placeholder={String(thisYear - 3)}
                    className={inputClass}
                    {...aria("foundedYear")}
                  />
                </Field>
              )}
            </div>
            {imageField("Логотип или фото")}
          </Section>

          <Section
            title={events ? "Что произошло" : "Расскажи о себе"}
            lead={events ? undefined : "Три коротких блока — по ним голосующие сравнивают участников. Enter переносит строку, пустая строка разделяет абзацы."}
          >
            <Field
              id="text"
              label={events ? "Описание события" : "О команде"}
              hint={events ? "Что случилось и когда. Источники добавь в ссылки ниже." : "Кто вы, чем занимаетесь, с какими вертикалями и гео работаете"}
              error={errors.text}
            >
              <textarea id="text" name="text" rows={6} defaultValue={draft?.text} className={inputClass} {...aria("text", true)} />
            </Field>
            {team && (
              <>
                <Field id="achievements" label="Что сделали за год" hint="Главные результаты 2026 года: проекты, цифры, запуски" error={errors.achievements}>
                  <textarea id="achievements" name="achievements" rows={6} maxLength={3000} defaultValue={details?.achievements} className={inputClass} {...aria("achievements", true)} />
                </Field>
                <Field id="whyVote" label="Почему голосовать за вас" hint="Чем вы отличаетесь от остальных в номинации" error={errors.whyVote}>
                  <textarea id="whyVote" name="whyVote" rows={4} maxLength={2000} defaultValue={details?.whyVote} className={inputClass} {...aria("whyVote", true)} />
                </Field>
              </>
            )}
          </Section>

          {team && (
            <Section title="Кейсы" lead="Необязательно, но с ними сравнивать проще: голосующий увидит твои работы рядом с работами других участников.">
              <div data-field="cases">
                <CasesEditor initial={details?.cases} inputClass={inputClass} />
                {errors.cases && (
                  <p role="alert" className="mt-2 text-sm text-danger">
                    {errors.cases}
                  </p>
                )}
              </div>
            </Section>
          )}

          <Section title={events ? "Источники" : "Ссылки"} lead={events ? "Публичные источники, где описано событие." : "Необязательно: сайт, канал, портфолио, соцсети."}>
            {linksField}
          </Section>
        </>
      ) : (
        <>
          <Field id="title" label="Заголовок" error={errors.title}>
            <input id="title" name="title" defaultValue={draft?.title} className={inputClass} {...aria("title")} />
          </Field>
          <Field id="text" label="Текст" hint="Абзацы разделяй пустой строкой. ## Заголовок, - пункт списка, **жирный**, [текст](https://ссылка)" error={errors.text}>
            <textarea id="text" name="text" rows={14} defaultValue={draft?.text} className={inputClass} {...aria("text", true)} />
          </Field>
          {imageField("Обложка")}
          {linksField}
        </>
      )}

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
