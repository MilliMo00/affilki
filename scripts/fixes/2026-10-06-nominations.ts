// Разовая правка данных по просьбе владельца (2026-10-06):
//   №2 «Лучшее инфлюенс-открытие» → «Лучшее инфлюенс-агентство» (с новыми текстами и тестовыми участниками);
//   №4 «Открытие года (платформа)» → «Открытие года».
// Запуск: npx tsx scripts/fixes/2026-10-06-nominations.ts. Повторный запуск ничего не меняет.
import { db } from "../../lib/db";
import { renderMarkup } from "../../lib/markup";
import { NOMINATION_SEEDS } from "../../prisma/seed-awards";

const OLD_TEST_NOMINEES = ["zaliv-s-utra", "buyer-diary", "cpa-bez-vody", "tier-one-talks"];

async function main() {
  const season = await db.season.findFirstOrThrow({ orderBy: { year: "desc" } });

  const opening = await db.nomination.updateMany({
    where: { seasonId: season.id, slug: "platform-launch", title: "Открытие года (платформа)" },
    data: { title: "Открытие года", coverText: "Открытие" },
  });
  console.log(`открытие года: обновлено ${opening.count}`);

  // Новость о премии перечисляет номинации по именам — правим и там.
  const news = await db.article.findUnique({ where: { slug: "affilki-awards-2026-kak-ustroena-premiya" } });
  const stale = "инфлюенс-открытие, дизайн-агентство, открытие года среди платформ,";
  if (news?.contentSource?.includes(stale)) {
    const source = news.contentSource.replace(stale, "инфлюенс-агентство, дизайн-агентство, открытие года,");
    await db.article.update({ where: { id: news.id }, data: { contentSource: source, contentHtml: renderMarkup(source) } });
    console.log("новость о премии: список номинаций обновлён");
  }

  const old = await db.nomination.findUnique({ where: { seasonId_slug: { seasonId: season.id, slug: "influence-launch" } } });
  if (!old) return console.log("инфлюенс: уже обновлено, пропускаю");

  const { nominees, ...fields } = NOMINATION_SEEDS.find((n) => n.slug === "influence-agency")!;
  await db.nomination.update({ where: { id: old.id }, data: fields });

  // Старые тестовые участники были блогами и каналами — под агентства не подходят.
  // Удаляем только их и только если за них никто не голосовал; всё, что добавил владелец, остаётся.
  const removed = await db.nominee.deleteMany({ where: { nominationId: old.id, slug: { in: OLD_TEST_NOMINEES }, votes: { none: {} } } });
  let added = 0;
  for (const nominee of nominees) {
    if (await db.nominee.findUnique({ where: { slug: nominee.slug } })) continue;
    await db.nominee.create({
      data: { ...nominee, nominationId: old.id, published: true, links: { site: `https://example.com/${nominee.slug}` } },
    });
    added += 1;
  }
  console.log(`инфлюенс: номинация обновлена, тестовых участников убрано ${removed.count}, добавлено ${added}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
