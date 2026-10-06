// Разовая публикация стартовых материалов на уже работающей базе:
//   npx tsx scripts/publish-content.ts
import { db } from "../lib/db";
import { publishContent } from "../prisma/publish-content";

publishContent(db)
  .then((result) => console.log(`created: ${result.created}, placeholders archived: ${result.archived}`))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
