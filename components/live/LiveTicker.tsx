"use client";

import Link from "next/link";
import { formatCount } from "@/lib/format";
import { useLive } from "@/lib/live-store";
import type { LiveSnapshot } from "@/lib/live/types";

/** Бегущая строка лидеров под шапкой. Пауза при наведении и фокусе; без анимации при reduced motion. */
export function LiveTicker({ initial }: { initial: LiveSnapshot }) {
  const snapshot = useLive(initial) ?? initial;
  if (snapshot.status !== "live" && snapshot.status !== "frozen") return null;

  const items = snapshot.nominations
    .filter((n) => n.state === "live" && n.rows.length > 0)
    .map((n) => ({ slug: n.slug, title: n.title, leader: n.rows[0] }));
  const frozen = snapshot.status === "frozen";

  return (
    <div className="border-b border-petal/50 bg-ink" role="region" aria-label="Live-результаты">
      <div className="container-page flex h-12 items-center gap-4">
        <p className="shrink-0 text-sm text-muted">
          Голосов отдано: <span className="font-display font-bold tabular-nums text-paper">{formatCount(snapshot.totalVotes)}</span>
        </p>
        {frozen ? (
          <p className="truncate text-sm text-text">Результаты скрыты до объявления итогов</p>
        ) : items.length === 0 ? (
          <p className="truncate text-sm text-text">Набираем голоса — табло скоро откроется</p>
        ) : (
          <div className="ticker relative min-w-0 flex-1 overflow-hidden">
            {/* Список продублирован, чтобы прокрутка шла без шва; копия скрыта от скринридера. */}
            <div className="ticker-track flex w-max gap-8">
              {[0, 1].map((copy) => (
                <ul key={copy} className="flex shrink-0 gap-8" aria-hidden={copy === 1}>
                  {items.map((item) => (
                    <li key={item.slug} className="shrink-0 text-sm">
                      <Link
                        href={`/awards/${item.slug}?tab=live`}
                        tabIndex={copy === 1 ? -1 : undefined}
                        className="text-muted hover:text-paper"
                      >
                        {item.title}: лидирует <span className="font-semibold text-paper">{item.leader.name}</span> —{" "}
                        <span className="tabular-nums text-paper">{item.leader.percent}%</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
