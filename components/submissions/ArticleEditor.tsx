"use client";

import { ArrowDown, ArrowUp, Bold, Heading2, ImagePlus, Italic, Link2, List, Loader2, Pilcrow, Plus, Quote, Trash2, type LucideIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { blockKey, parseBlocks, serializeBlocks, type Block, type BlockType } from "@/lib/blocks";
import { cn } from "@/lib/cn";
import { renderMarkup } from "@/lib/markup";

// Редактор статьи из блоков: текст, подзаголовок, фото с подписью, список, цитата.
// Блоки можно добавлять, переставлять и удалять; результат уходит в форму скрытым полем в простой разметке.

const TYPES: Record<BlockType, { label: string; Icon: LucideIcon }> = {
  text: { label: "Текст", Icon: Pilcrow },
  heading: { label: "Подзаголовок", Icon: Heading2 },
  image: { label: "Фото", Icon: ImagePlus },
  list: { label: "Список", Icon: List },
  quote: { label: "Цитата", Icon: Quote },
};

const empty = (type: BlockType): Block =>
  type === "image" ? { key: blockKey(), type, url: "", caption: "" } : { key: blockKey(), type, text: "" };

const iconButton = "flex size-10 items-center justify-center rounded-full text-muted-bright hover:bg-paper/10 hover:text-paper disabled:opacity-30 disabled:hover:bg-transparent";
const toolButton = "flex h-9 items-center gap-1.5 rounded-full border border-petal/60 px-3 text-sm font-medium text-paper hover:border-glow hover:bg-glow/20";

/** Поле текста с кнопками «жирный», «курсив», «ссылка» — они оборачивают выделенный фрагмент. */
function RichText({ value, onChange, rows, placeholder, inputClass, label }: { value: string; onChange: (value: string) => void; rows: number; placeholder: string; inputClass: string; label: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [linkFor, setLinkFor] = useState<{ start: number; end: number } | null>(null);
  const [url, setUrl] = useState("https://");

  const wrap = (before: string, after: string, fallback: string) => {
    const area = ref.current;
    if (!area) return;
    const { selectionStart: start, selectionEnd: end } = area;
    const selected = value.slice(start, end) || fallback;
    onChange(value.slice(0, start) + before + selected + after + value.slice(end));
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const applyLink = () => {
    if (!linkFor || !/^https:\/\/\S+$/.test(url.trim())) return;
    const text = value.slice(linkFor.start, linkFor.end) || "ссылка";
    onChange(value.slice(0, linkFor.start) + `[${text.replace(/[[\]]/g, "")}](${url.trim()})` + value.slice(linkFor.end));
    setLinkFor(null);
    setUrl("https://");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => wrap("**", "**", "жирный текст")} className={toolButton}>
          <Bold size={16} strokeWidth={2} aria-hidden /> Жирный
        </button>
        <button type="button" onClick={() => wrap("*", "*", "курсив")} className={toolButton}>
          <Italic size={16} strokeWidth={2} aria-hidden /> Курсив
        </button>
        <button
          type="button"
          onClick={() => {
            const area = ref.current;
            setLinkFor(area ? { start: area.selectionStart, end: area.selectionEnd } : { start: value.length, end: value.length });
          }}
          className={toolButton}
        >
          <Link2 size={16} strokeWidth={2} aria-hidden /> Ссылка
        </button>
      </div>
      {linkFor && (
        <div className="flex flex-wrap items-center gap-2 rounded-card border border-petal/60 p-3">
          <span className="text-sm text-muted-bright">
            {linkFor.end > linkFor.start ? `Ссылка на «${value.slice(linkFor.start, linkFor.end).slice(0, 40)}»` : "Ссылка"}
          </span>
          <input
            aria-label="Адрес ссылки"
            value={url}
            inputMode="url"
            autoFocus
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyLink();
              }
            }}
            className={cn(inputClass, "min-w-0 flex-1 !py-2")}
          />
          <button type="button" onClick={applyLink} className={toolButton}>
            Вставить
          </button>
          <button type="button" onClick={() => setLinkFor(null)} className="text-sm text-muted-bright underline">
            Отмена
          </button>
        </div>
      )}
      <textarea ref={ref} aria-label={label} value={value} rows={rows} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={inputClass} />
    </div>
  );
}

function ImageBlock({ block, onChange, inputClass }: { block: Extract<Block, { type: "image" }>; onChange: (patch: Partial<Extract<Block, { type: "image" }>>) => void; inputClass: string }) {
  const [state, setState] = useState<{ uploading: boolean; error: string | null }>({ uploading: false, error: null });

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return setState({ uploading: false, error: "Файл больше 10 МБ." });
    setState({ uploading: true, error: null });
    const body = new FormData();
    body.set("image", file);
    try {
      const res = await fetch("/api/uploads", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) return setState({ uploading: false, error: data.error ?? "Не получилось загрузить фото." });
      onChange({ url: data.url });
      setState({ uploading: false, error: null });
    } catch {
      setState({ uploading: false, error: "Нет связи с сервером." });
    }
  };

  return (
    <div className="space-y-3">
      {block.url ? (
        // eslint-disable-next-line @next/next/no-img-element -- превью загруженного файла как есть
        <img src={block.url} alt={block.caption || "Фото в статье"} className="max-h-80 w-full rounded-card border border-petal/60 bg-ink object-contain" />
      ) : null}
      <label className={cn("flex cursor-pointer items-center justify-center gap-2 rounded-card border border-dashed border-muted-bright/70 px-4 text-muted-bright hover:border-paper hover:text-paper", block.url ? "h-11" : "h-32 flex-col")}>
        {state.uploading ? <Loader2 size={20} className="animate-spin" aria-hidden /> : <ImagePlus size={20} strokeWidth={1.75} aria-hidden />}
        <span className="font-medium">{state.uploading ? "Загружаем…" : block.url ? "Заменить фото" : "Выбрать фото — PNG, JPG, GIF или WebP до 10 МБ"}</span>
        <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="sr-only" disabled={state.uploading} onChange={(event) => upload(event.target.files?.[0])} />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <input aria-label="Подпись к фото" value={block.caption} maxLength={160} placeholder="Подпись к фото (необязательно)" onChange={(event) => onChange({ caption: event.target.value })} className={inputClass} />
    </div>
  );
}

type ArticleEditorProps = { name: string; initial?: string; inputClass: string; invalid?: boolean };

export function ArticleEditor({ name, initial = "", inputClass, invalid }: ArticleEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => {
    const parsed = parseBlocks(initial);
    return parsed.length > 0 ? parsed : [{ key: "i0", type: "text", text: "" }];
  });
  const [preview, setPreview] = useState(false);
  const source = useMemo(() => serializeBlocks(blocks), [blocks]);

  const update = (key: string, patch: Partial<Block>) => setBlocks((list) => list.map((block) => (block.key === key ? ({ ...block, ...patch } as Block) : block)));
  const move = (index: number, by: number) =>
    setBlocks((list) => {
      const next = [...list];
      [next[index], next[index + by]] = [next[index + by], next[index]];
      return next;
    });
  const add = (type: BlockType, at = blocks.length) => setBlocks((list) => [...list.slice(0, at), empty(type), ...list.slice(at)]);

  const addBar = () => (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(TYPES) as BlockType[]).map((type) => {
        const { label, Icon } = TYPES[type];
        return (
          <button key={type} type="button" onClick={() => add(type)} className={toolButton}>
            <Plus size={14} strokeWidth={2} aria-hidden />
            <Icon size={16} strokeWidth={1.75} aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={cn("rounded-card border p-3 sm:p-4", invalid ? "border-danger" : "border-petal/60")}>
      <input type="hidden" name={name} value={source} />

      <div role="tablist" aria-label="Режим редактора" className="mb-4 flex gap-2">
        {[
          { key: false, label: "Редактор" },
          { key: true, label: "Предпросмотр" },
        ].map((tab) => (
          <button
            key={tab.label}
            type="button"
            role="tab"
            aria-selected={preview === tab.key}
            onClick={() => setPreview(tab.key)}
            className={cn("h-9 rounded-full px-4 text-sm font-semibold", preview === tab.key ? "bg-paper text-deep" : "text-paper hover:bg-paper/10")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {preview ? (
        source ? (
          <div className="article-body min-h-40" dangerouslySetInnerHTML={{ __html: renderMarkup(source) }} />
        ) : (
          <p className="py-10 text-center text-muted">Пока пусто — добавь текст или фото.</p>
        )
      ) : (
        <div className="space-y-3">
          {blocks.map((block, index) => {
            const { label, Icon } = TYPES[block.type];
            return (
              <div key={block.key} role="group" aria-label={`${label}, блок ${index + 1}`} className="rounded-card border border-petal/40 bg-deep/30 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Icon size={18} strokeWidth={1.75} aria-hidden className="text-muted-bright" />
                  <span className="text-sm font-semibold text-muted-bright">{label}</span>
                  <div className="ml-auto flex">
                    <button type="button" aria-label="Выше" disabled={index === 0} onClick={() => move(index, -1)} className={iconButton}>
                      <ArrowUp size={18} strokeWidth={1.75} aria-hidden />
                    </button>
                    <button type="button" aria-label="Ниже" disabled={index === blocks.length - 1} onClick={() => move(index, 1)} className={iconButton}>
                      <ArrowDown size={18} strokeWidth={1.75} aria-hidden />
                    </button>
                    <button type="button" aria-label="Удалить блок" onClick={() => setBlocks((list) => list.filter((item) => item.key !== block.key))} className={iconButton}>
                      <Trash2 size={18} strokeWidth={1.75} aria-hidden />
                    </button>
                  </div>
                </div>

                {block.type === "text" && (
                  <RichText
                    label={`Текст, блок ${index + 1}`}
                    value={block.text}
                    rows={Math.min(14, Math.max(4, block.text.split("\n").length + 1))}
                    placeholder="Пиши как в обычном редакторе. Enter — новая строка, пустая строка — новый абзац."
                    inputClass={inputClass}
                    onChange={(text) => update(block.key, { text })}
                  />
                )}
                {block.type === "heading" && (
                  <input
                    aria-label={`Подзаголовок, блок ${index + 1}`}
                    value={block.text}
                    maxLength={140}
                    placeholder="Подзаголовок раздела"
                    onChange={(event) => update(block.key, { text: event.target.value })}
                    className={cn(inputClass, "font-display text-lg font-bold")}
                  />
                )}
                {block.type === "list" && (
                  <RichText
                    label={`Список, блок ${index + 1}`}
                    value={block.text}
                    rows={Math.max(3, block.text.split("\n").length + 1)}
                    placeholder={"Каждый пункт — с новой строки\nВторой пункт\nТретий пункт"}
                    inputClass={inputClass}
                    onChange={(text) => update(block.key, { text })}
                  />
                )}
                {block.type === "quote" && (
                  <RichText
                    label={`Цитата, блок ${index + 1}`}
                    value={block.text}
                    rows={3}
                    placeholder="Цитата или важная мысль"
                    inputClass={inputClass}
                    onChange={(text) => update(block.key, { text })}
                  />
                )}
                {block.type === "image" && <ImageBlock block={block} inputClass={inputClass} onChange={(patch) => update(block.key, patch)} />}
              </div>
            );
          })}

          <div className="pt-1">
            <p className="mb-2 text-sm text-muted">Добавить блок:</p>
            {addBar()}
          </div>
        </div>
      )}
    </div>
  );
}
