"use client";

import { Countdown } from "@/components/awards/Countdown";
import { formatDate } from "@/lib/format";
import { useLive } from "@/lib/live-store";
import type { LiveSnapshot } from "@/lib/live/types";
import { LiveIndicator } from "./LiveIndicator";
import { LiveRows } from "./LiveRows";

const plate = "rounded-card border border-petal px-6 py-12 text-center text-lg text-paper";

/** Пояснение вместо табло, когда распределение голосов показывать нельзя. */
export function LiveNotice({ snapshot }: { snapshot: LiveSnapshot }) {
  if (snapshot.status === "off") return <p className={plate}>Результаты объявим после окончания голосования.</p>;
  if (snapshot.status === "soon") {
    return <p className={plate}>Live-табло заработает с началом голосования — {formatDate(new Date(snapshot.votingStartsAt))}.</p>;
  }
  return (
    <div className={`${plate} flex flex-col items-center gap-6`}>
      <p>Финальные часы — результаты скрыты до объявления итогов.</p>
      <Countdown to={snapshot.votingEndsAt} label="До объявления итогов" />
    </div>
  );
}

type LiveBoardProps = {
  nominationSlug: string;
  initial: LiveSnapshot | null;
  highlight?: string;
  /** Не показывать пояснения: если табло закрыто, блок просто исчезает. */
  quiet?: boolean;
  title?: string;
};

/** Live-табло одной номинации. */
export function LiveBoard({ nominationSlug, initial, highlight, quiet, title }: LiveBoardProps) {
  const snapshot = useLive(initial);
  if (!snapshot) return null;
  if (snapshot.status !== "live" && snapshot.status !== "final") return quiet ? null : <LiveNotice snapshot={snapshot} />;

  const nomination = snapshot.nominations.find((n) => n.slug === nominationSlug);
  if (!nomination || nomination.state === "collecting") {
    return quiet ? null : <p className={plate}>Набираем голоса. Табло откроется, когда голосов станет больше.</p>;
  }

  const final = snapshot.status === "final";
  return (
    <div>
      {title && <h2 className="mb-4 text-2xl">{title}</h2>}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {final ? <p className="font-semibold text-paper">Итоги голосования</p> : <LiveIndicator updatedAt={snapshot.updatedAt} />}
        <p className="text-sm text-muted-bright">
          Голоса комьюнити{nomination.total !== undefined && ` · всего ${nomination.total}`}
        </p>
      </div>
      <LiveRows rows={nomination.rows} final={final} highlight={highlight} />
    </div>
  );
}
