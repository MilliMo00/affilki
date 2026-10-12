// Разовая правка данных по просьбе владельца (2026-10-12): новые даты сезона.
// Голосование с 1 декабря 2026 по 15 января 2027 (МСК), итоги 17 января. Заявки принимаются уже сейчас.
// Запуск: npx tsx scripts/fixes/2026-10-12-season-dates.ts. Повторный запуск ничего не меняет.
import { db } from "../../lib/db";
import { renderMarkup } from "../../lib/markup";

const OLD_DATES = `- **1 ноября** — открываем приём участников в номинации.
- **23 ноября** — старт голосования.
- **30 декабря** — конец голосования и итоги в тот же день.`;
const NEW_DATES = `- **Уже сейчас** — принимаем заявки участников в номинации.
- **1 декабря** — старт голосования.
- **15 января** — конец голосования.
- **17 января** — объявляем итоги.`;

async function main() {
  const season = await db.season.findUniqueOrThrow({ where: { year: 2026 } });
  await db.season.update({
    where: { id: season.id },
    data: {
      votingStartsAt: new Date("2026-11-30T21:00:00Z"),
      votingEndsAt: new Date("2027-01-15T20:59:00Z"),
      resultsAt: new Date("2027-01-17T09:00:00Z"),
    },
  });
  console.log("сезон 2026: голосование 1 декабря — 15 января, итоги 17 января");

  const news = await db.article.findUnique({ where: { slug: "affilki-awards-2026-kak-ustroena-premiya" } });
  const source = news?.contentSource?.replace(/\r\n/g, "\n");
  if (news && source?.includes(OLD_DATES)) {
    const next = source.replace(OLD_DATES, NEW_DATES);
    await db.article.update({ where: { id: news.id }, data: { contentSource: next, contentHtml: renderMarkup(next) } });
    console.log("новость о премии: даты обновлены");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
