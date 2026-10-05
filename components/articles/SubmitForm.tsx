"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import type { Category } from "@/lib/data/types";
import { fieldErrors, submitSchema, type SubmitErrors } from "@/lib/validation/submit";

type Errors = SubmitErrors & { form?: string };

export function SubmitForm({ categories }: { categories: Category[] }) {
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const input = { ...Object.fromEntries(data), consent: data.get("consent") === "on" };

    const showErrors = (found: Errors) => {
      setErrors(found);
      const first = Object.keys(found).find((key) => key !== "form");
      if (first) form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    };

    const parsed = submitSchema.safeParse(input);
    if (!parsed.success) return showErrors(fieldErrors(parsed.error));

    setPending(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        setErrors({});
        setSent(true);
        return;
      }
      const body = await res.json().catch(() => ({}));
      showErrors(body.errors ?? { form: body.error ?? "Не получилось отправить. Попробуй ещё раз." });
    } catch {
      showErrors({ form: "Нет связи с сервером. Проверь интернет и попробуй ещё раз." });
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
        <h2 className="mt-5 text-2xl">Заявка отправлена</h2>
        <p className="mt-2 text-lg text-text">Ответим в Telegram.</p>
        <Button variant="secondary" className="mt-6" onClick={() => setSent(false)}>
          Отправить ещё одну
        </Button>
      </div>
    );
  }

  const aria = (key: keyof SubmitErrors, hint?: boolean) => ({
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

      {errors.form && (
        <p role="alert" className="text-danger">
          {errors.form}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
        {pending ? "Отправляем…" : "Отправить заявку"}
      </Button>
    </form>
  );
}
