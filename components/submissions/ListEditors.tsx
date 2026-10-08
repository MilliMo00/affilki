"use client";

import { Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useId, useState } from "react";
import { MAX_CASES, MAX_LINKS, type CaseItem, type LinkButton } from "@/lib/profile";

// Списки-редакторы для заявки и карточки участника: ссылки-кнопки и кейсы.
// Значение уходит в форму скрытым полем (linksJson / casesJson), картинки кейсов — полями `caseImage:<key>`.

// Ключи начальных строк — по порядку: они должны совпасть на сервере и в браузере. Новые строки получают случайный.
let counter = 0;
const newKey = () => `k${Date.now().toString(36)}${(counter++).toString(36)}`;

const addButton = "inline-flex h-11 items-center gap-2 rounded-full border border-petal px-4 font-semibold text-paper hover:border-glow hover:bg-glow/20";
const removeButton = "flex size-11 shrink-0 items-center justify-center rounded-full text-muted-bright hover:bg-paper/10 hover:text-paper";

type LinksEditorProps = { initial?: LinkButton[]; inputClass: string; name?: string; invalid?: boolean };

export function LinksEditor({ initial = [], inputClass, name = "linksJson", invalid }: LinksEditorProps) {
  const [rows, setRows] = useState(() => (initial.length > 0 ? initial : [{ title: "", url: "" }]).map((row, index) => ({ ...row, key: `i${index}` })));
  const id = useId();
  const change = (key: string, patch: Partial<LinkButton>) => setRows((list) => list.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={JSON.stringify(rows.map(({ title, url }) => ({ title, url })))} />
      {rows.map((row, index) => (
        <div key={row.key} className="flex items-start gap-2">
          <div className="grid flex-1 gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <input
              aria-label={`Название ссылки ${index + 1}`}
              value={row.title}
              maxLength={40}
              placeholder="Название: Сайт, Канал, Портфолио"
              onChange={(event) => change(row.key, { title: event.target.value })}
              className={inputClass}
            />
            <input
              id={index === 0 ? id : undefined}
              aria-label={`Адрес ссылки ${index + 1}`}
              aria-invalid={invalid || undefined}
              value={row.url}
              inputMode="url"
              placeholder="https://"
              onChange={(event) => change(row.key, { url: event.target.value })}
              className={inputClass}
            />
          </div>
          <button type="button" aria-label={`Убрать ссылку ${index + 1}`} onClick={() => setRows((list) => list.filter((item) => item.key !== row.key))} className={removeButton}>
            <Trash2 size={20} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      ))}
      {rows.length < MAX_LINKS && (
        <button type="button" onClick={() => setRows((list) => [...list, { title: "", url: "", key: newKey() }])} className={addButton}>
          <Plus size={20} strokeWidth={1.75} aria-hidden />
          Добавить ссылку
        </button>
      )}
    </div>
  );
}

type CasesEditorProps = { initial?: CaseItem[]; inputClass: string };

export function CasesEditor({ initial = [], inputClass }: CasesEditorProps) {
  const [rows, setRows] = useState(() => initial.map((row, index) => ({ ...row, url: row.url ?? "", key: `i${index}` })));
  const change = (key: string, patch: Partial<{ title: string; text: string; url: string }>) =>
    setRows((list) => list.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  return (
    <div className="space-y-4">
      <input type="hidden" name="casesJson" value={JSON.stringify(rows.map(({ key, title, text, url, imageUrl }) => ({ key, title, text, url, imageUrl })))} />
      {rows.map((row, index) => (
        <div key={row.key} role="group" aria-label={`Кейс ${index + 1}`} className="rounded-card border border-petal/60 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-semibold text-paper">Кейс {index + 1}</p>
            <button type="button" aria-label={`Убрать кейс ${index + 1}`} onClick={() => setRows((list) => list.filter((item) => item.key !== row.key))} className={removeButton}>
              <Trash2 size={20} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
          <div className="space-y-3">
            <input
              aria-label={`Название кейса ${index + 1}`}
              value={row.title}
              maxLength={120}
              placeholder="Название: что за проект и для кого"
              onChange={(event) => change(row.key, { title: event.target.value })}
              className={inputClass}
            />
            <textarea
              aria-label={`Описание кейса ${index + 1}`}
              value={row.text}
              rows={3}
              maxLength={800}
              placeholder="Что сделали и какой результат: цифры, сроки, гео"
              onChange={(event) => change(row.key, { text: event.target.value })}
              className={inputClass}
            />
            <input
              aria-label={`Ссылка на кейс ${index + 1}`}
              value={row.url}
              inputMode="url"
              placeholder="Ссылка на кейс, если есть: https://"
              onChange={(event) => change(row.key, { url: event.target.value })}
              className={inputClass}
            />
            <div className="flex flex-wrap items-center gap-3">
              {row.imageUrl && (
                <span className="relative block h-16 w-28 shrink-0 overflow-hidden rounded-card border border-petal/60">
                  <Image src={row.imageUrl} alt="Текущая картинка кейса" fill sizes="112px" className="object-cover" />
                </span>
              )}
              <label className="block min-w-0 flex-1 text-sm text-muted">
                <span className="mb-1 block">{row.imageUrl ? "Заменить картинку" : "Картинка кейса: скриншот, креатив, статистика"} — до 10 МБ</span>
                <input type="file" name={`caseImage:${row.key}`} accept="image/png,image/jpeg,image/gif,image/webp" className="block w-full text-text" />
              </label>
            </div>
          </div>
        </div>
      ))}
      {rows.length < MAX_CASES && (
        <button
          type="button"
          onClick={() => setRows((list) => [...list, { title: "", text: "", url: "", imageUrl: null, key: newKey() }])}
          className={addButton}
        >
          <Plus size={20} strokeWidth={1.75} aria-hidden />
          Добавить кейс
        </button>
      )}
    </div>
  );
}
