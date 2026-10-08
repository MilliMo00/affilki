-- AlterTable
ALTER TABLE "Nominee" ADD COLUMN     "profile" JSONB;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "details" JSONB;

-- Описание участника раньше сохранялось одной строкой без переносов.
-- Возвращаем исходный текст автора из заявки там, где описание не правили вручную.
UPDATE "Nominee" n
SET "description" = s."text"
FROM "Submission" s
WHERE s."resultId" = n."id"
  AND s."kind" = 'NOMINEE'
  AND regexp_replace(n."description", '\s+', '', 'g') = regexp_replace(regexp_replace(s."text", '[*`]', '', 'g'), '\s+', '', 'g');
