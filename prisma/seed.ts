import { PrismaClient } from "@prisma/client";
import { DEFAULT_CATEGORIES } from "../lib/nav";
import { ARTICLE_SEEDS } from "./seed-articles";
import { NOMINATION_SEEDS } from "./seed-awards";

// Сиды только заполняют пустую базу и никогда не перезаписывают существующие данные.
const db = new PrismaClient();

async function seedContent() {
  if ((await db.category.count()) > 0) return console.log("content: уже есть, пропускаю");

  for (const [order, category] of DEFAULT_CATEGORIES.entries()) {
    await db.category.create({ data: { ...category, order } });
  }
  const categories = await db.category.findMany();
  const idBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  for (const { category, ...article } of ARTICLE_SEEDS) {
    await db.article.create({ data: { ...article, status: "PUBLISHED", categoryId: idBySlug.get(category)! } });
  }
  console.log(`content: ${categories.length} рубрик, ${ARTICLE_SEEDS.length} статей`);
}

async function seedAwards() {
  if (await db.season.findUnique({ where: { year: 2026 } })) return console.log("awards: сезон 2026 уже есть, пропускаю");

  // Приём команд с 1 ноября, финал и итоги 30 декабря (даты владельца).
  // Старт голосования — условный, уточняется: задаётся в админке.
  const season = await db.season.create({
    data: {
      year: 2026,
      title: "AFFILKI Awards 2026",
      stage: "APPLICATIONS",
      votingStartsAt: new Date("2026-12-01T09:00:00Z"),
      votingEndsAt: new Date("2026-12-30T20:59:00Z"),
      nextStageAt: null,
    },
  });

  for (const [i, { nominees, ...nomination }] of NOMINATION_SEEDS.entries()) {
    await db.nomination.create({
      data: {
        ...nomination,
        order: i + 1,
        seasonId: season.id,
        nominees: {
          create: nominees.map((nominee) => ({
            ...nominee,
            published: true,
            links: { site: `https://example.com/${nominee.slug}` },
          })),
        },
      },
    });
  }
  console.log(`awards: сезон 2026, ${NOMINATION_SEEDS.length} номинаций`);
}

async function main() {
  await seedContent();
  await seedAwards();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
