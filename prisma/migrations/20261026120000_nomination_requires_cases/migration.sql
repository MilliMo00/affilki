-- Кейсы в заявке нужны не везде: каналам с вакансиями они не нужны (решение владельца 2026-10-26).
ALTER TABLE "Nomination" ADD COLUMN "requiresCases" BOOLEAN NOT NULL DEFAULT true;

UPDATE "Nomination" SET "requiresCases" = false WHERE "slug" = 'jobs-channel';
