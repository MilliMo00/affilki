// Разовая правка данных по просьбе владельца (2026-10-12): новая номинация «Лучшее IT-агентство».
// Встаёт четвёртой, сразу после дизайн-агентств; остальные сдвигаются на одну позицию.
// Запуск: npx tsx scripts/fixes/2026-10-12-it-agency.ts. Повторный запуск ничего не меняет.
import { db } from "../../lib/db";
import { renderMarkup } from "../../lib/markup";
import { NOMINATION_SEEDS } from "../../prisma/seed-awards";

async function main() {
  const season = await db.season.findFirstOrThrow({ orderBy: { year: "desc" } });

  // Новость о премии перечисляет номинации по именам — правим и там.
  const news = await db.article.findUnique({ where: { slug: "affilki-awards-2026-kak-ustroena-premiya" } });
  if (news) {
    const fix = (text: string) =>
      text
        .replace("Девять номинаций,", "Десять номинаций,")
        .replace("Их девять: лучшая медиабаинговая команда, инфлюенс-агентство, дизайн-агентство, открытие года,", "Их десять: лучшая медиабаинговая команда, инфлюенс-агентство, дизайн-агентство, IT-агентство, открытие года,");
    const source = news.contentSource ? fix(news.contentSource) : null;
    const excerpt = fix(news.excerpt);
    if (source !== news.contentSource || excerpt !== news.excerpt) {
      await db.article.update({ where: { id: news.id }, data: { excerpt, ...(source && { contentSource: source, contentHtml: renderMarkup(source) }) } });
      console.log("новость о премии: число и список номинаций обновлены");
    }
  }

  if (await db.nomination.findUnique({ where: { seasonId_slug: { seasonId: season.id, slug: "it-agency" } } })) {
    return console.log("IT-агентства: номинация уже есть, пропускаю");
  }

  const design = await db.nomination.findUniqueOrThrow({ where: { seasonId_slug: { seasonId: season.id, slug: "design-agency" } } });
  const { nominees, ...fields } = NOMINATION_SEEDS.find((n) => n.slug === "it-agency")!;

  await db.$transaction(async (tx) => {
    await tx.nomination.updateMany({ where: { seasonId: season.id, order: { gt: design.order } }, data: { order: { increment: 1 } } });
    await tx.nomination.create({
      data: {
        ...fields,
        order: design.order + 1,
        seasonId: season.id,
        nominees: { create: nominees.map((nominee) => ({ ...nominee, published: true, links: { site: `https://example.com/${nominee.slug}` } })) },
      },
    });
  });
  console.log(`IT-агентства: номинация создана на позиции ${design.order + 1}, тестовых участников ${nominees.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
