// Редактируемый текст (contenteditable) ⇄ простая разметка. Только для браузера.
// Внутри редактора человек видит готовое оформление, а в заявку уходит разметка lib/markup.ts.

import { renderInline } from "@/lib/markup";

const BLOCK = new Set(["DIV", "P", "LI"]);

/** Разметка → HTML для редактора: каждая строка — отдельный <div>, пустая строка — <div><br></div>. */
export function markupToEditable(source: string) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  return lines.map((line) => `<div>${renderInline(line) || "<br>"}</div>`).join("");
}

// Пробелы по краям выносим за пределы звёздочек: «** жирный **» разметка не распознает.
function mark(inner: string, marker: string) {
  return inner
    .split("\n")
    .map((line) => {
      const match = /^(\s*)(.*?)(\s*)$/.exec(line)!;
      return match[2] ? `${match[1]}${marker}${match[2]}${marker}${match[3]}` : line;
    })
    .join("\n");
}

function walk(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? "").replace(/ /g, " ");
  if (!(node instanceof HTMLElement)) return "";
  const tag = node.tagName;
  if (tag === "BR") {
    // Последний <br> в строке браузер ставит сам, чтобы пустая строка не схлопнулась: в тексте его нет.
    const parent = node.parentElement;
    const lastInBlock = !!parent && parent.lastChild === node && (BLOCK.has(parent.tagName) || parent.isContentEditable);
    return lastInBlock ? "" : "\n";
  }
  const inner = [...node.childNodes].map(walk).join("");
  const style = node.style;
  let out = inner;
  if (tag === "A") {
    const href = node.getAttribute("href") ?? "";
    out = /^https:\/\/\S+$/.test(href) && inner.trim() ? `[${inner.replace(/[[\]]/g, "")}](${href})` : inner;
  } else if (tag === "B" || tag === "STRONG" || Number(style.fontWeight) >= 600 || style.fontWeight === "bold") {
    out = mark(inner, "**");
  } else if (tag === "I" || tag === "EM" || style.fontStyle === "italic") {
    out = mark(inner, "*");
  }
  return BLOCK.has(tag) ? `\n${out}` : out;
}

/** HTML редактора → разметка. */
export function editableToMarkup(root: HTMLElement) {
  return [...root.childNodes]
    .map(walk)
    .join("")
    .replace(/^\n/, "")
    .replace(/\n+$/, "");
}
