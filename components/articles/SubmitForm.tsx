"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import type { Category } from "@/lib/data";

type Errors = Partial<Record<"name" | "tg" | "title" | "description" | "draftUrl" | "consent", string>>;

function validate(data: FormData): Errors {
  const errors: Errors = {};
  const text = (key: string) => String(data.get(key) ?? "").trim();

  if (!text("name")) errors.name = "Укажи имя или название команды";
  if (!/^(@|https:\/\/t\.me\/)?[a-zA-Z0-9_]{4,32}$/.test(text("tg"))) errors.tg = "Нужен ник в Telegram, например @username";
  if (text("title").length < 5) errors.title = "Заголовок слишком короткий";
  if (text("description").length < 20) errors.description = "Опиши тему хотя бы в паре предложений";
  if (text("draftUrl") && !/^https:\/\/\S+$/.test(text("draftUrl"))) errors.draftUrl = "Ссылка должна начинаться с https://";
  if (!data.get("consent")) errors.consent = "Без согласия заявку отправить нельзя";
  return errors;
}

export function SubmitForm({ categories }: { categories: Category[] }) {
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const found = validate(data);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    // TODO(Фаза 3): отправка на /api/submit — honeypot, rate limit, запись в БД.
    // Сейчас форма ничего никуда не отправляет.
    setSent(true);
  };

  if (sent) {
    return (
      <div role="status" className="rounded-card border border-petal/60 bg-deep/40 p-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-indigo text-paper">
          <Check size={28} strokeWidth={1.75} aria-hidden />
        </span>
        <h2 className="mt-5 text-2xl">Заявка отправлена</h2>
        <p className="mt-2 text-lg text-text">Ответим в Telegram.</p>
        <Button variant="secondary" className="mt-6" onClick={() => setSent(false)}>
          Отправить ещё одну
        </Button>
      </div>
    );
  }

  const aria = (key: keyof Errors, hint?: boolean) => ({
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${key}-error` : hint ? `${key}-hint` : undefined,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {/* Honeypot: люди это поле не видят, боты заполняют. */}
      <div className="hidden" aria-hidden>
        <label>
          Сайт
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Field id="name" label="Имя или команда" error={errors.name}>
        <input id="name" name="name" autoComplete="name" className={inputClass} {...aria("name")} />
      </Field>

      <Field id="tg" label="Контакт в Telegram" hint="Сюда напишет редактор" error={errors.tg}>
        <input id="tg" name="tg" placeholder="@username" autoComplete="off" className={inputClass} {...aria("tg", true)} />
      </Field>

      <Field id="category" label="Рубрика">
        <select id="category" name="category" className={inputClass}>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.title}
            </option>
          ))}
        </select>
      </Field>

      <Field id="title" label="Заголовок" error={errors.title}>
        <input id="title" name="title" className={inputClass} {...aria("title")} />
      </Field>

      <Field
        id="description"
        label="Краткое описание"
        hint="О чём материал, какие цифры и выводы"
        error={errors.description}
      >
        <textarea id="description" name="description" rows={5} className={inputClass} {...aria("description", true)} />
      </Field>

      <Field id="draftUrl" label="Ссылка на черновик" optional hint="Google Docs или Notion" error={errors.draftUrl}>
        <input
          id="draftUrl"
          name="draftUrl"
          type="url"
          inputMode="url"
          placeholder="https://"
          className={inputClass}
          {...aria("draftUrl", true)}
        />
      </Field>

      <div>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="consent"
            className="mt-1 size-5 shrink-0 accent-[#7B62F0]"
            {...aria("consent")}
          />
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

      <Button type="submit" size="lg" className="w-full sm:w-auto">
        Отправить заявку
      </Button>
    </form>
  );
}
