"use client";

import { formatCount } from "@/lib/format";
import { useLive } from "@/lib/live-store";
import type { LiveSnapshot } from "@/lib/live/types";

/** Мини-строка лидера на карточке номинации. Пока лидера показывать нельзя — пусто. */
export function CardLeader({ slug, initial }: { slug: string; initial: LiveSnapshot | null }) {
  const snapshot = useLive(initial);
  const nomination = snapshot?.status === "live" || snapshot?.status === "final" ? snapshot.nominations.find((n) => n.slug === slug) : null;
  const leader = nomination?.state === "live" ? nomination.rows[0] : null;
  if (!leader) return null;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate text-muted-bright">
          {snapshot?.status === "final" ? "Победитель" : "Лидирует"}: <span className="font-semibold text-paper">{leader.name}</span>
        </span>
        <span className="shrink-0 font-display font-bold tabular-nums text-paper">{leader.percent}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/50">
        <div className="h-full rounded-full bg-glow transition-[width] duration-500" style={{ width: `${leader.percent}%` }} />
      </div>
    </div>
  );
}

/** Общий счётчик голосов, обновляется вместе с табло. */
export function LiveTotal({ initial }: { initial: LiveSnapshot | null }) {
  const snapshot = useLive(initial);
  return <>{formatCount(snapshot?.totalVotes ?? 0)}</>;
}
