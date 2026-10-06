import type { PrismaClient } from "@prisma/client";
import { plainText, readingMinutes, renderMarkup } from "../lib/markup";
import { CONTENT, PLACEHOLDER_SLUGS } from "./content";

/**
 * Публикует стартовые материалы редакции: создаёт те, которых ещё нет (существующие не трогает),
 * и убирает в архив заглушки из первых сидов. Архив обратим — статус можно вернуть в админке.
 */
export async function publishContent(db: PrismaClient) {
  const categories = new Map((await db.category.findMany()).map((category) => [category.slug, category.id]));
  const now = Date.now();
  let created = 0;

  for (const [i, item] of CONTENT.entries()) {
    if (await db.article.findUnique({ where: { slug: item.slug } })) {
      // Уже опубликовано: дописываем только текст обложки, если его ещё нет. Правки редактора не трогаем.
      await db.article.updateMany({ where: { slug: item.slug, coverText: null }, data: { coverText: item.coverText } });
      continue;
    }
    const categoryId = categories.get(item.category);
    if (!categoryId) throw new Error(`Нет рубрики ${item.category}`);
    await db.article.create({
      data: {
        slug: item.slug,
        title: item.title,
        excerpt: item.excerpt || plainText(item.source).slice(0, 180),
        coverText: item.coverText,
        contentSource: item.source,
        contentHtml: renderMarkup(item.source),
        categoryId,
        readingMin: readingMinutes(item.source),
        status: "PUBLISHED",
        // Порядок в ленте — как в списке: первый материал самый свежий.
        publishedAt: new Date(now - i * 60_000),
      },
    });
    created += 1;
  }

  const archived = await db.article.updateMany({
    where: { slug: { in: PLACEHOLDER_SLUGS }, status: "PUBLISHED" },
    data: { status: "ARCHIVED" },
  });
  return { created, archived: archived.count };
}
