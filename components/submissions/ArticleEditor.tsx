"use client";

import { ArrowDown, ArrowUp, Bold, Heading2, ImagePlus, Italic, Link2, List, Loader2, Pilcrow, Plus, Quote, Trash2, type LucideIcon } from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArticleCover } from "@/components/articles/ArticleCover";
import { blockKey, parseBlocks, serializeBlocks, type Block, type BlockType } from "@/lib/blocks";
import { cn } from "@/lib/cn";
import { renderMarkup } from "@/lib/markup";
import { editableToMarkup, markupToEditable } from "@/lib/rich-dom";

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

type RichMode = "text" | "list" | "quote";

const MODE_CLASS: Record<RichMode, string> = {
  text: "",
  // Каждая строка списка — отдельный <div>: показываем их пунктами.
  list: "pl-6 [&>div]:list-item [&>div]:list-disc",
  quote: "border-l-4 border-glow pl-4 italic",
};

/**
 * Поле с готовым оформлением, как в Ворде: жирный виден жирным, ссылка — ссылкой.
 * Кнопки и сочетания Ctrl/Cmd+B, Ctrl/Cmd+I оформляют выделенный фрагмент. В заявку уходит разметка.
 */
function RichText({ value, onChange, placeholder, inputClass, label, mode }: { value: string; onChange: (value: string) => void; placeholder: string; inputClass: string; label: string; mode: RichMode }) {
  const ref = useRef<HTMLDivElement>(null);
  const range = useRef<Range | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [url, setUrl] = useState("https://");
  const [isEmpty, setIsEmpty] = useState(!value.trim());

  // Содержимое ставим один раз: дальше его ведёт браузер, иначе курсор прыгал бы при каждом вводе.
  useLayoutEffect(() => {
    if (ref.current) ref.current.innerHTML = markupToEditable(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- только при создании блока
  }, []);

  const sync = () => {
    if (!ref.current) return;
    const markup = editableToMarkup(ref.current);
    setIsEmpty(!markup.trim());
    onChange(markup);
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && ref.current?.contains(selection.anchorNode)) range.current = selection.getRangeAt(0).cloneRange();
  };
  const restoreSelection = () => {
    ref.current?.focus();
    const selection = window.getSelection();
    if (selection && range.current) {
      selection.removeAllRanges();
      selection.addRange(range.current);
    }
  };

  const format = (command: "bold" | "italic") => {
    restoreSelection();
    document.execCommand(command);
    sync();
  };

  const applyLink = () => {
    const href = url.trim();
    if (!/^https:\/\/\S+$/.test(href)) return;
    restoreSelection();
    const selection = window.getSelection();
    if (selection && selection.isCollapsed) document.execCommand("insertText", false, "ссылка");
    if (selection && selection.isCollapsed && selection.anchorNode) {
      // Только что вставленное слово выделяем, чтобы превратить его в ссылку.
      const node = selection.anchorNode;
      const end = selection.anchorOffset;
      const next = document.createRange();
      next.setStart(node, Math.max(0, end - "ссылка".length));
      next.setEnd(node, end);
      selection.removeAllRanges();
      selection.addRange(next);
    }
    document.execCommand("createLink", false, href);
    sync();
    setLinkOpen(false);
    setUrl("https://");
  };

  // Кнопки не забирают фокус у текста, иначе пропадёт выделение.
  const keep = (event: React.MouseEvent) => event.preventDefault();

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" onMouseDown={keep} onClick={() => format("bold")} className={toolButton}>
          <Bold size={16} strokeWidth={2} aria-hidden /> Жирный
        </button>
        <button type="button" onMouseDown={keep} onClick={() => format("italic")} className={toolButton}>
          <Italic size={16} strokeWidth={2} aria-hidden /> Курсив
        </button>
        <button
          type="button"
          onMouseDown={keep}
          onClick={() => {
            saveSelection();
            setLinkText(range.current?.toString().slice(0, 40) ?? "");
            setLinkOpen(true);
          }}
          className={toolButton}
        >
          <Link2 size={16} strokeWidth={2} aria-hidden /> Ссылка
        </button>
      </div>
      {linkOpen && (
        <div className="flex flex-wrap items-center gap-2 rounded-card border border-petal/60 p-3">
          <span className="text-sm text-muted-bright">{linkText ? `Ссылка на «${linkText}»` : "Ссылка"}</span>
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
          <button type="button" onClick={() => setLinkOpen(false)} className="text-sm text-muted-bright underline">
            Отмена
          </button>
        </div>
      )}
      <div className="relative">
        {isEmpty && (
          <p aria-hidden className="pointer-events-none absolute left-4 top-3 whitespace-pre-line text-muted/70">
            {placeholder}
          </p>
        )}
        <div
          ref={ref}
          role="textbox"
          aria-multiline="true"
          aria-label={label}
          contentEditable
          suppressContentEditableWarning
          onInput={sync}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          onBlur={saveSelection}
          onPaste={(event) => {
            // Вставляем только текст: чужое оформление из Word и сайтов в статью не попадает.
            event.preventDefault();
            document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
          }}
          className={cn(
            inputClass,
            "min-h-28 whitespace-pre-wrap break-words text-lg leading-relaxed [&_a]:text-paper [&_a]:underline [&_a]:decoration-glow [&_a]:underline-offset-4 [&_b]:font-bold [&_strong]:font-bold",
            MODE_CLASS[mode],
          )}
        />
      </div>
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
      const res = await fetch("/api/uploads", { method: "POST", body, signal: AbortSignal.timeout(120_000) });
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

type ArticleEditorProps = {
  name: string;
  initial?: string;
  inputClass: string;
  invalid?: boolean;
  /** Для шапки предпросмотра: рубрики и обложка, уже сохранённая в заявке. */
  categories: { slug: string; title: string }[];
  coverUrl?: string | null;
};

type PreviewMeta = { title: string; author: string; category: { slug: string; title: string }; cover: string | null };

export function ArticleEditor({ name, initial = "", inputClass, invalid, categories, coverUrl = null }: ArticleEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => {
    const parsed = parseBlocks(initial);
    return parsed.length > 0 ? parsed : [{ key: "i0", type: "text", text: "" }];
  });
  const [preview, setPreview] = useState(false);
  const [meta, setMeta] = useState<PreviewMeta | null>(null);
  const root = useRef<HTMLDivElement>(null);

  // Заголовок, автор, рубрика и обложка берутся из полей формы в момент открытия предпросмотра.
  const openPreview = (on: boolean) => {
    setPreview(on);
    if (!on) return;
    const form = root.current?.closest("form");
    const field = (fieldName: string) => form?.querySelector<HTMLInputElement>(`[name="${fieldName}"]`);
    const slug = form?.querySelector<HTMLInputElement>('[name="categorySlug"]:checked')?.value ?? categories[0]?.slug;
    const file = field("image")?.files?.[0];
    setMeta((previous) => {
      if (previous?.cover?.startsWith("blob:")) URL.revokeObjectURL(previous.cover);
      return {
        title: field("title")?.value.trim() ?? "",
        author: field("authorName")?.value.trim() ?? "",
        category: categories.find((category) => category.slug === slug) ?? { slug: "articles", title: "Статьи" },
        cover: file ? URL.createObjectURL(file) : coverUrl,
      };
    });
  };
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
    <div ref={root} className={cn("rounded-card border p-3 sm:p-4", invalid ? "border-danger" : "border-petal/60")}>
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
            onClick={() => openPreview(tab.key)}
            className={cn("h-9 rounded-full px-4 text-sm font-semibold", preview === tab.key ? "bg-paper text-deep" : "text-paper hover:bg-paper/10")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {preview ? (
        <div className="px-1 py-2 sm:px-3">
          {meta && (
            <header className="max-w-prose">
              <p className="font-medium text-muted-bright">{meta.category.title}</p>
              <h1 className="mt-3 text-2xl sm:text-3xl">{meta.title || "Заголовок статьи"}</h1>
              {meta.author && <p className="mt-4 text-sm font-medium text-text">{meta.author}</p>}
            </header>
          )}
          {meta && (
            <div className="relative my-6 aspect-video overflow-hidden rounded-card">
              <ArticleCover
                slug={meta.title || "preview"}
                title={meta.title || "Заголовок статьи"}
                category={meta.category}
                coverUrl={meta.cover}
                coverText={null}
                sizes="(min-width: 768px) 640px, 100vw"
              />
            </div>
          )}
          {!meta?.cover && <p className="-mt-3 mb-6 text-sm text-muted">Обложку не загрузили — на сайте будет фирменный плакат, как выше.</p>}
          {source ? (
            <div className="article-body min-h-40" dangerouslySetInnerHTML={{ __html: renderMarkup(source) }} />
          ) : (
            <p className="py-10 text-center text-muted">Пока пусто — добавь текст или фото.</p>
          )}
        </div>
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
                    mode="text"
                    value={block.text}
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
                    mode="list"
                    value={block.text}
                    placeholder={"Каждый пункт — с новой строки\nВторой пункт\nТретий пункт"}
                    inputClass={inputClass}
                    onChange={(text) => update(block.key, { text })}
                  />
                )}
                {block.type === "quote" && (
                  <RichText
                    label={`Цитата, блок ${index + 1}`}
                    mode="quote"
                    value={block.text}
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
