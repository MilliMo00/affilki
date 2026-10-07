// Общее для обложки-плаката на странице (CSS) и её версии картинкой (PNG): текст и выбор композиции.

/** Текст плаката из заголовка: часть до двоеточия или тире, иначе первые два слова. */
export function posterText(title: string) {
  const clean = title.replace(/^(Разбор|Кейс|Обзор|Интервью)\s*:\s*/i, "");
  const head = clean.split(/\s*[:—]\s*/)[0].trim();
  const text = head.length <= 18 ? head : clean.split(/\s+/).slice(0, 2).join(" ");
  return text.replace(/[,.!?]+$/, "");
}

export const COVER_VARIANTS = 5;

/** Номер композиции по адресу статьи: у одной статьи он всегда один и тот же. */
export function coverVariant(slug: string) {
  return [...slug].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) % 9973, 7) % COVER_VARIANTS;
}

/** Слово плаката в верхнем регистре и его кегль в процентах ширины обложки. */
export function posterSize(coverText: string | null, title: string) {
  const text = (coverText?.trim() || posterText(title)).toUpperCase();
  const longest = Math.max(...text.split(/\s+/).map((word) => word.length));
  // Буква Unbounded почти квадратная: самое длинное слово должно помещаться в ширину плаката.
  const size = Math.min(text.length <= 5 ? 24 : text.length <= 9 ? 15.5 : text.length <= 14 ? 12 : 9.5, 86 / longest);
  return { text, size };
}
