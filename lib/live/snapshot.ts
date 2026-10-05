import type { Season } from "@prisma/client";
import { db } from "@/lib/db";
import type { LiveNomination, LiveSnapshot } from "./types";

type Cache = { snapshot: LiveSnapshot; expiresAt: number };

// Кэш в памяти процесса: тысяча зрителей получает один и тот же снимок, а не тысячу запросов в базу.
// Когда процессов станет больше одного, заменяется на Redis за этим же интерфейсом.
const globalForLive = globalThis as unknown as { liveCache?: Cache };

export function liveStatus(season: Season, now: Date): LiveSnapshot["status"] {
  if (!season.liveEnabled) return "off";
  if (season.resultsPublished) return "final";
  if (now < season.votingStartsAt) return "soon";
  const freezeAt = season.votingEndsAt.getTime() - season.liveFreezeHours * 3_600_000;
  return now.getTime() >= freezeAt ? "frozen" : "live";
}

/** Считает снимок одним агрегирующим запросом. Аннулированные голоса и голоса забаненных не учитываются. */
export async function computeSnapshot(season: Season, now = new Date()): Promise<LiveSnapshot> {
  const status = liveStatus(season, now);
  const banned = (await db.tgBan.findMany({ select: { tgUserId: true } })).map((b) => b.tgUserId);
  const counted = { voidedAt: null, tgUserId: { notIn: banned }, nomination: { seasonId: season.id } };

  const base = {
    status,
    updatedAt: now.toISOString(),
    refreshSec: season.liveRefreshSec,
    mode: season.liveMode === "COUNTS" ? ("counts" as const) : ("percent" as const),
    votingStartsAt: season.votingStartsAt.toISOString(),
    votingEndsAt: season.votingEndsAt.toISOString(),
    totalVotes: await db.vote.count({ where: counted }),
  };

  // Выключено, не началось или заморожено — отдаём только общее число голосов.
  if (status !== "live" && status !== "final") return { ...base, nominations: [] };

  const [groups, nominations] = await Promise.all([
    db.vote.groupBy({ by: ["nomineeId"], where: counted, _count: { _all: true } }),
    db.nomination.findMany({
      where: { seasonId: season.id },
      orderBy: { order: "asc" },
      include: { nominees: { where: { published: true } } },
    }),
  ]);
  const votesByNominee = new Map(groups.map((g) => [g.nomineeId, g._count._all]));
  const showCounts = base.mode === "counts";

  const result: LiveNomination[] = nominations.map((nomination) => {
    const nominees = nomination.nominees
      .filter((n) => !nomination.requiresLegalReview || n.legalChecked)
      .map((n) => ({ nominee: n, count: votesByNominee.get(n.id) ?? 0 }))
      .sort((a, b) => b.count - a.count || a.nominee.name.localeCompare(b.nominee.name, "ru"));
    const total = nominees.reduce((sum, n) => sum + n.count, 0);
    const head = { slug: nomination.slug, title: nomination.title, number: nomination.order };

    // Пока голосов меньше порога, распределение не показываем (после публикации итогов — показываем всегда).
    if (status === "live" && total < season.liveMinVotes) return { ...head, state: "collecting", rows: [] };

    return {
      ...head,
      state: "live",
      total: showCounts ? total : undefined,
      rows: nominees.map(({ nominee, count }, i) => ({
        slug: nominee.slug,
        name: nominee.name,
        logoUrl: nominee.logoUrl,
        place: i + 1,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
        count: showCounts ? count : undefined,
      })),
    };
  });

  return { ...base, nominations: result };
}

/** Снимок текущего сезона из кэша; пересчитывается не чаще, чем раз в liveRefreshSec. */
export async function getLiveSnapshot(): Promise<LiveSnapshot | null> {
  const cached = globalForLive.liveCache;
  if (cached && cached.expiresAt > Date.now()) return cached.snapshot;

  const season = await db.season.findFirst({ orderBy: { year: "desc" } });
  if (!season) return null;

  const snapshot = await computeSnapshot(season);
  globalForLive.liveCache = { snapshot, expiresAt: Date.now() + Math.max(5, season.liveRefreshSec) * 1000 };
  return snapshot;
}
