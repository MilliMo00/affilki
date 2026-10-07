// Разовая правка по просьбе владельца (2026-10-07): расставить стартовым материалам даты публикации
// из prisma/content.ts. Запуск: npx tsx scripts/fixes/2026-10-07-article-dates.ts. Повторный запуск безвреден.
import { db } from "../../lib/db";
import { CONTENT } from "../../prisma/content";

async function main() {
  let updated = 0;
  for (const item of CONTENT) {
    if (!item.date) continue;
    const result = await db.article.updateMany({ where: { slug: item.slug }, data: { publishedAt: new Date(`${item.date}T09:00:00Z`) } });
    updated += result.count;
  }
  console.log(`dates set: ${updated}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
