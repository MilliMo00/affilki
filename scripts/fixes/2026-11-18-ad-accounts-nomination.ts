// Разовая правка по просьбе владельца (2026-11-18): номинация «Самое громкое событие года» заменяется
// на «Лучшее агентство по выдаче рекламных аккаунтов». Запись номинации та же (место в списке сохраняется),
// меняются адрес, тексты, иконка и тип: это обычная командная номинация, не номинация событий.
// Участники-события, если они были, снимаются с публикации — к новой номинации они не относятся.
// Запуск: npx tsx scripts/fixes/2026-11-18-ad-accounts-nomination.ts. Повторный запуск ничего не меняет.
import { db } from "../../lib/db";
import { renderMarkup } from "../../lib/markup";
import { NOMINATION_SEEDS } from "../../prisma/seed-awards";

async function main() {
  const season = await db.season.findFirstOrThrow({ orderBy: { year: "desc" } });
  const old = await db.nomination.findUnique({ where: { seasonId_slug: { seasonId: season.id, slug: "loudest-event" } }, include: { nominees: true } });

  if (old) {
    const { nominees: _none, ...fields } = NOMINATION_SEEDS.find((n) => n.slug === "ad-accounts-agency")!;
    await db.nomination.update({
      where: { id: old.id },
      data: { ...fields, isEvent: false, requiresLegalReview: false, requiresCases: false, acceptingEntries: true },
    });
    const hidden = await db.nominee.updateMany({ where: { nominationId: old.id, published: true }, data: { published: false } });
    const drafts = await db.submission.count({ where: { nominationId: old.id, status: { in: ["INVITED", "PENDING", "CHANGES_REQUESTED"] } } });
    console.log(`номинация заменена; участников-событий снято с публикации: ${hidden.count}; открытых заявок в ней: ${drafts}`);
  } else {
    console.log("номинация уже заменена, пропускаю");
  }

  const news = await db.article.findUnique({ where: { slug: "affilki-awards-2026-kak-ustroena-premiya" } });
  const stale = "открытие года, самое громкое событие, лучший новостной канал";
  if (news?.contentSource?.includes(stale)) {
    const source = news.contentSource.replace(stale, "открытие года, агентство по выдаче рекламных аккаунтов, лучший новостной канал");
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
