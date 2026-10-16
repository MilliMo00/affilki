-- Номинации событий: одинаковая форма у «Самого громкого события года» и «Главного скандала года».
ALTER TABLE "Nomination" ADD COLUMN "isEvent" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Nomination" SET "isEvent" = true WHERE "requiresLegalReview" = true OR "slug" = 'loudest-event';
