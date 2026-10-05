// Простая разметка для статей и заявок → безопасный HTML.
// Весь ввод сначала экранируется, а теги создаёт только этот модуль: вставить свой HTML или скрипт нельзя.
//
//   ## Заголовок, ### Подзаголовок
//   - пункт списка          1. нумерованный пункт
//   > цитата                ``` блок кода ```
//   **жирный**, *курсив*, `код`, [текст](https://ссылка)
//   ![подпись](/uploads/файл.png) — картинка отдельной строкой

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// Ссылки — только https; картинки — только свои загрузки или https.
const SAFE_LINK = /^https:\/\/[^\s"'<>]+$/;
const SAFE_IMAGE = /^(?:\/uploads\/[a-f0-9]{24}\.(?:png|jpg|gif|webp)|https:\/\/[^\s"'<>]+)$/;

function inline(escaped: string) {
  return escaped
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, text: string, url: string) =>
      SAFE_LINK.test(url) ? `<a href="${url}" target="_blank" rel="noopener nofollow">${text}</a>` : match,
    );
}

export function renderMarkup(source: string): string {
  const blocks = source.replace(/\r\n?/g, "\n").trim().split(/\n{2,}/);
  const html: string[] = [];
  let code: string[] | null = null;

  for (const raw of blocks) {
    // Блок кода может содержать пустые строки — собираем его до закрывающих ```.
    if (code) {
      code.push(raw);
      if (raw.trimEnd().endsWith("```")) {
        html.push(`<pre><code>${escapeHtml(code.join("\n\n").replace(/^```[^\n]*\n?/, "").replace(/\n?```\s*$/, ""))}</code></pre>`);
        code = null;
      }
      continue;
    }
    if (raw.startsWith("```")) {
      if (raw.trimEnd().endsWith("```") && raw.trim().length > 3) {
        html.push(`<pre><code>${escapeHtml(raw.replace(/^```[^\n]*\n?/, "").replace(/\n?```\s*$/, ""))}</code></pre>`);
      } else {
        code = [raw];
      }
      continue;
    }

    const lines = raw.split("\n").map((line) => line.trimEnd());
    const image = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(raw.trim());

    if (image && SAFE_IMAGE.test(image[2])) {
      html.push(`<p><img src="${escapeHtml(image[2])}" alt="${escapeHtml(image[1])}" loading="lazy"></p>`);
    } else if (raw.startsWith("### ")) {
      html.push(`<h3>${inline(escapeHtml(raw.slice(4).trim()))}</h3>`);
    } else if (raw.startsWith("## ")) {
      html.push(`<h2>${inline(escapeHtml(raw.slice(3).trim()))}</h2>`);
    } else if (lines.every((line) => /^[-*] /.test(line))) {
      html.push(`<ul>${lines.map((line) => `<li>${inline(escapeHtml(line.slice(2)))}</li>`).join("")}</ul>`);
    } else if (lines.every((line) => /^\d+[.)] /.test(line))) {
      html.push(`<ol>${lines.map((line) => `<li>${inline(escapeHtml(line.replace(/^\d+[.)] /, "")))}</li>`).join("")}</ol>`);
    } else if (lines.every((line) => line.startsWith("> ") || line === ">")) {
      html.push(`<blockquote><p>${lines.map((line) => inline(escapeHtml(line.replace(/^> ?/, "")))).join("<br>")}</p></blockquote>`);
    } else {
      html.push(`<p>${lines.map((line) => inline(escapeHtml(line))).join("<br>")}</p>`);
    }
  }
  if (code) html.push(`<pre><code>${escapeHtml(code.join("\n\n").replace(/^```[^\n]*\n?/, ""))}</code></pre>`);
  return html.join("\n");
}

/** Текст без разметки — для анонса и подсчёта времени чтения. */
export function plainText(source: string) {
  return source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^[#>\-*\d.) ]+/gm, "")
    .replace(/[*`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export const readingMinutes = (source: string) => Math.max(1, Math.round(plainText(source).split(" ").length / 180));
