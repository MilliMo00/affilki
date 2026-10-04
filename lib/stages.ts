// 5 лепестков = 5 этапов сезона (ТЗ 2.1). Порядок совпадает с enum Stage в Prisma.
export const STAGES = ["APPLICATIONS", "SHORTLIST", "VOTING", "COUNTING", "CEREMONY"] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  APPLICATIONS: "Приём заявок",
  SHORTLIST: "Шорт-лист",
  VOTING: "Голосование",
  COUNTING: "Подсчёт",
  CEREMONY: "Церемония",
};

/** Сколько лепестков закрашено: текущий этап считается начатым. */
export function stageNumber(stage: Stage) {
  return STAGES.indexOf(stage) + 1;
}
