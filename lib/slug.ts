const MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

/** «Тихий Залив» → «tihiy-zaliv»: латиница, цифры и дефисы для адреса страницы. */
export function slugify(text: string) {
  const slug = [...text.toLowerCase()]
    .map((char) => MAP[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/, "");
  return slug || "item";
}

/** Подбирает свободный адрес: если занят — добавляет -2, -3 и так далее. */
export async function uniqueSlug(base: string, taken: (slug: string) => Promise<boolean>) {
  const slug = slugify(base);
  if (!(await taken(slug))) return slug;
  for (let n = 2; n < 500; n++) if (!(await taken(`${slug}-${n}`))) return `${slug}-${n}`;
  return `${slug}-${Date.now()}`;
}
