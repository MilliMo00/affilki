// Блоки редактора статьи ⇄ простая разметка lib/markup.ts.
// Заявка по-прежнему хранит текст разметкой: редактор лишь собирает её из блоков и разбирает обратно.

export type Block =
  | { key: string; type: "text"; text: string }
  | { key: string; type: "heading"; text: string }
  | { key: string; type: "image"; url: string; caption: string }
  | { key: string; type: "list"; text: string }
  | { key: string; type: "quote"; text: string };

export type BlockType = Block["type"];

let counter = 0;
export const blockKey = () => `b${Date.now().toString(36)}${(counter++).toString(36)}`;

const IMAGE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;
const clean = (text: string) => text.replace(/\r\n?/g, "\n").trim();

/** Разбирает разметку на блоки. Ключи по порядку — одинаковые на сервере и в браузере. */
export function parseBlocks(source: string): Block[] {
  const parts = clean(source).split(/\n{2,}/).filter(Boolean);
  return parts.map((raw, i): Block => {
    const key = `i${i}`;
    const lines = raw.split("\n");
    const image = IMAGE.exec(raw.trim());
    if (image) return { key, type: "image", url: image[2], caption: image[1] };
    if (/^#{2,3} /.test(raw)) return { key, type: "heading", text: raw.replace(/^#{2,3} /, "").trim() };
    if (lines.every((line) => /^[-*] /.test(line))) return { key, type: "list", text: lines.map((line) => line.slice(2)).join("\n") };
    if (lines.every((line) => line.startsWith(">"))) return { key, type: "quote", text: lines.map((line) => line.replace(/^> ?/, "")).join("\n") };
    return { key, type: "text", text: raw };
  });
}

/** Собирает разметку из блоков. Пустые блоки пропускаются. */
export function serializeBlocks(blocks: Block[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "image":
          return block.url ? `![${block.caption.replace(/[[\]()\n]/g, " ").trim()}](${block.url})` : "";
        case "heading":
          return block.text.trim() ? `## ${block.text.replace(/\n/g, " ").trim()}` : "";
        case "list":
          return clean(block.text).split("\n").map((line) => line.trim()).filter(Boolean).map((line) => `- ${line}`).join("\n");
        case "quote":
          return clean(block.text).split("\n").map((line) => `> ${line.trim()}`).join("\n").replace(/^> $/, "");
        default:
          // Пустые строки внутри абзаца делят его на отдельные абзацы — это и нужно.
          return clean(block.text).replace(/\n{3,}/g, "\n\n");
      }
    })
    .filter((part) => part.trim())
    .join("\n\n");
}
