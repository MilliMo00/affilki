-- Тестовое голосование переезжает с номинации на сезон: одна кнопка на всю премию.
ALTER TABLE "Season" ADD COLUMN "testVoting" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Vote" ADD COLUMN "isTest" BOOLEAN NOT NULL DEFAULT false;

-- Голоса, отданные до старта сезона, — тестовые: их удалит выключение тестового режима.
UPDATE "Vote" v
SET "isTest" = true
FROM "Nomination" n
JOIN "Season" s ON s."id" = n."seasonId"
WHERE v."nominationId" = n."id" AND v."createdAt" < s."votingStartsAt";

ALTER TABLE "Nomination" DROP COLUMN "testVoting";
