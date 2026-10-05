export const PERIODS = [
  { key: "1", label: "Сегодня", days: 1 },
  { key: "7", label: "7 дней", days: 7 },
  { key: "30", label: "30 дней", days: 30 },
  { key: "90", label: "90 дней", days: 90 },
] as const;

/** Период отчёта и предыдущий период той же длины — для сравнения. */
export function resolvePeriod(key: string | undefined, now = new Date()) {
  const period = PERIODS.find((p) => p.key === key) ?? PERIODS[1];
  const ms = period.days * 86_400_000;
  // «Сегодня» — с начала суток по Москве; остальные — скользящее окно.
  const from = period.days === 1 ? new Date(Math.floor((now.getTime() + 3 * 3_600_000) / 86_400_000) * 86_400_000 - 3 * 3_600_000) : new Date(now.getTime() - ms);
  return { period, from, to: now, prevFrom: new Date(from.getTime() - ms), prevTo: from };
}
