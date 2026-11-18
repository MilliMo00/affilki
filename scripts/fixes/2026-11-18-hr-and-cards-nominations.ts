// Разовая правка по просьбе владельца (2026-11-18): «Прорыв года» → «Лучшее HR-агентство»,
// «Главный скандал года» → «Лучший сервис виртуальных карт». Записи номинаций те же (место в списке сохраняется),
// меняются адрес, тексты, иконка и тип: обе — обычные командные номинации, без юридической проверки.
// Участники старых номинаций, если были, снимаются с публикации — к новым номинациям они не относятся.
// Запуск: npx tsx scripts/fixes/2026-11-18-hr-and-cards-nominations.ts. Повторный запуск ничего не меняет.
import { db } from "../../lib/db";
import { renderMarkup } from "../../lib/markup";
import { NOMINATION_SEEDS } from "../../prisma/seed-awards";

const REPLACE = [
  { from: "breakthrough", to: "hr-agency" },
  { from: "scandal-of-the-year", to: "virtual-cards-service" },
];

async function main() {
  const season = await db.season.findFirstOrThrow({ orderBy: { year: "desc" } });
  for (const { from, to } of REPLACE) {
    const old = await db.nomination.findUnique({ where: { seasonId_slug: { seasonId: season.id, slug: from } } });
    if (!old) {
      console.log(`${from}: уже заменена, пропускаю`);
      continue;
    }
    const { nominees: _none, ...fields } = NOMINATION_SEEDS.find((n) => n.slug === to)!;
    await db.nomination.update({
      where: { id: old.id },
      data: { ...fields, isEvent: false, requiresLegalReview: false, requiresCases: false, acceptingEntries: true },
    });
    const hidden = await db.nominee.updateMany({ where: { nominationId: old.id, published: true }, data: { published: false } });
    const open = await db.submission.count({ where: { nominationId: old.id, status: { in: ["INVITED", "PENDING", "CHANGES_REQUESTED"] } } });
    console.log(`${from} → ${to}: заменена; участников снято с публикации: ${hidden.count}; открытых заявок: ${open}`);
  }

  const news = await db.article.findUnique({ where: { slug: "affilki-awards-2026-kak-ustroena-premiya" } });
  const stale = "лучший канал по вакансиям, прорыв года и главный скандал года.";
  if (news?.contentSource?.includes(stale)) {
    const source = news.contentSource.replace(stale, "лучший канал по вакансиям, HR-агентство и сервис виртуальных карт.");
    await db.article.update({ where: { id: news.id }, data: { contentSource: source, contentHtml: renderMarkup(source) } });
    console.log("новость о премии: список номинаций обновлён");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
