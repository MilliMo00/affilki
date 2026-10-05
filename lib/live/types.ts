// Публичный снимок live-результатов. В нём только агрегаты: ни кто голосовал,
// ни когда. Всё, чего здесь нет, наружу не попадает вообще.

export type LiveRow = {
  slug: string;
  name: string;
  logoUrl: string | null;
  place: number;
  percent: number;
  /** Точное число голосов — только в режиме counts. */
  count?: number;
};

export type LiveNomination = {
  slug: string;
  title: string;
  number: number;
  /** collecting — голосов пока меньше порога, распределение не показываем. */
  state: "collecting" | "live";
  rows: LiveRow[];
  /** Всего голосов в номинации — только в режиме counts (иначе проценты выдавали бы точные числа). */
  total?: number;
};

export type LiveSnapshot = {
  /** off — live выключен; soon — голосование не началось; frozen — табло скрыто до итогов. */
  status: "off" | "soon" | "live" | "frozen" | "final";
  updatedAt: string;
  refreshSec: number;
  totalVotes: number;
  mode: "percent" | "counts";
  votingStartsAt: string;
  votingEndsAt: string;
  nominations: LiveNomination[];
};
