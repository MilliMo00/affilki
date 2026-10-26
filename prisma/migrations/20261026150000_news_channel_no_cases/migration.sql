-- Новостным каналам, как и каналам с вакансиями, кейсы в заявке не нужны.
UPDATE "Nomination" SET "requiresCases" = false WHERE "slug" = 'news-channel';
