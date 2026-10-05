// Детектор аномалий: считает по голосам участника признаки накрутки. Решение всегда принимает человек —
// флаги только показывают, куда смотреть.

export type VoteRow = { tgUserId: bigint; tgUsername: string | null; hasAvatar: boolean; ipHash: string; createdAt: Date };

export type Flag = { code: "burst" | "fresh" | "anonymous" | "shared_ip" | "uniform"; text: string };

const TEN_MIN = 10 * 60_000;
const share = (part: number, total: number) => (total === 0 ? 0 : part / total);
const percent = (value: number) => `${Math.round(value * 100)}%`;

type Options = {
  /** Во сколько раз пик за 10 минут должен превысить средний темп (настройка сезона). */
  burstFactor: number;
  /** Медиана Telegram ID по всем голосам сезона: выше — аккаунт свежее среднего. */
  medianTgId: bigint | null;
};

export function detectAnomalies(votes: VoteRow[], { burstFactor, medianTgId }: Options): Flag[] {
  const flags: Flag[] = [];
  const total = votes.length;
  // На совсем малых числах любые доли случайны — не шумим.
  if (total < 10) return flags;

  const times = votes.map((v) => v.createdAt.getTime()).sort((a, b) => a - b);

  // 1. Всплеск: максимум голосов в любом 10-минутном окне против среднего темпа.
  let peak = 0;
  for (let start = 0, end = 0; end < times.length; end++) {
    while (times[end] - times[start] > TEN_MIN) start++;
    peak = Math.max(peak, end - start + 1);
  }
  const windows = Math.max(1, (times[times.length - 1] - times[0]) / TEN_MIN);
  const average = total / windows;
  if (peak >= 10 && peak > average * burstFactor) {
    flags.push({ code: "burst", text: `Всплеск: ${peak} голосов за 10 минут при среднем темпе ${average.toFixed(1)}` });
  }

  // 2. Много свежих аккаунтов (ID выше медианы по сезону).
  if (medianTgId !== null) {
    const fresh = share(votes.filter((v) => v.tgUserId > medianTgId).length, total);
    if (fresh >= 0.75) flags.push({ code: "fresh", text: `${percent(fresh)} голосов — от аккаунтов свежее медианы` });
  }

  // 3. Высокая доля аккаунтов без username или без аватара.
  const anonymous = share(votes.filter((v) => !v.tgUsername || !v.hasAvatar).length, total);
  if (anonymous >= 0.5) flags.push({ code: "anonymous", text: `${percent(anonymous)} голосов — без username или фото профиля` });

  // 4. Много разных аккаунтов с одного адреса.
  const byIp = new Map<string, Set<bigint>>();
  for (const vote of votes) byIp.set(vote.ipHash, (byIp.get(vote.ipHash) ?? new Set()).add(vote.tgUserId));
  const crowded = [...byIp.values()].filter((accounts) => accounts.size >= 5);
  if (crowded.length > 0) {
    const accounts = crowded.reduce((sum, set) => sum + set.size, 0);
    flags.push({ code: "shared_ip", text: `${accounts} аккаунтов голосовали с ${crowded.length} общих адресов (от 5 аккаунтов на адрес)` });
  }

  // 5. Подозрительная равномерность: интервалы между голосами почти одинаковые.
  const gaps = times.slice(1).map((t, i) => t - times[i]);
  const mean = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  const deviation = Math.sqrt(gaps.reduce((sum, gap) => sum + (gap - mean) ** 2, 0) / gaps.length);
  if (mean > 0 && deviation / mean < 0.15) {
    flags.push({ code: "uniform", text: `Голоса идут с почти одинаковым интервалом (~${Math.round(mean / 1000)} сек)` });
  }

  return flags;
}

export function median(values: bigint[]): bigint | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return sorted[Math.floor(sorted.length / 2)];
}
