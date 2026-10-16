// Разовая правка по просьбе владельца (2026-10-16): перед приёмом настоящих заявок обнулить номинации.
// Удаляются все участники (тестовые «(тест)» и пробные), все заявки (пробные) и голоса за этих участников.
// Номинации, спонсоры, статьи и настройки сезона не трогаются. Перед запуском на сервере сделан бэкап базы.
// Запуск: npx tsx scripts/fixes/2026-10-16-clean-nominees.ts. Повторный запуск ничего не меняет.
import { db } from "../../lib/db";

async function main() {
  const result = await db.$transaction(async (tx) => {
    const votes = await tx.vote.deleteMany({});
    const nominees = await tx.nominee.deleteMany({});
    const submissions = await tx.submission.deleteMany({});
    return { votes: votes.count, nominees: nominees.count, submissions: submissions.count };
  });
  console.log(`удалено: участников ${result.nominees}, заявок ${result.submissions}, голосов ${result.votes}`);
  console.log(`номинаций осталось: ${await db.nomination.count()}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
