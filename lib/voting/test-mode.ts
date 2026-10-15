import type { Prisma, Season } from "@prisma/client";

// Тестовое голосование (кнопка в админке, раздел «Голоса»): до старта сезона голосовать можно везде,
// голоса помечаются isTest и удаляются при выключении. После настоящего старта тестовый режим
// ничего не открывает, а забытые тестовые голоса не попадают ни в табло, ни в итоги.

type SeasonDates = Pick<Season, "testVoting" | "votingStartsAt">;

/** Идёт ли сейчас тестовое голосование. */
export const testModeActive = (season: SeasonDates, now = new Date()) => season.testVoting && now < season.votingStartsAt;

/** Какие голоса считать: тестовые — только пока идёт тест. */
export const countedVotes = (season: SeasonDates, now = new Date()): Prisma.VoteWhereInput =>
  testModeActive(season, now) ? {} : { isTest: false };
