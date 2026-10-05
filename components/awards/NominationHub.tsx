"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { NomGroup } from "@/lib/data/types";
import type { LiveSnapshot } from "@/lib/live/types";
import { NominationCard, type NominationCardData } from "./NominationCard";

type HubNomination = NominationCardData & { group: NomGroup };

const FILTERS: { key: NomGroup | "ALL"; label: string }[] = [
  { key: "ALL", label: "Все" },
  { key: "TEAMS", label: "Команды и агентства" },
  { key: "MEDIA", label: "Медиа и каналы" },
  { key: "MARKET", label: "Рынок" },
];

type NominationHubProps = { nominations: HubNomination[]; filters?: boolean; live: LiveSnapshot | null };

/** Сетка номинаций; чипсы фильтруют её без перезагрузки. */
export function NominationHub({ nominations, filters = true, live }: NominationHubProps) {
  const [active, setActive] = useState<NomGroup | "ALL">("ALL");
  const visible = active === "ALL" ? nominations : nominations.filter((n) => n.group === active);

  return (
    <>
      {filters && (
        <div role="group" aria-label="Фильтр номинаций" className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex w-max gap-2 py-1">
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                aria-pressed={active === filter.key}
                onClick={() => setActive(filter.key)}
                className={cn(
                  "h-11 rounded-full border px-5 font-medium transition-colors",
                  active === filter.key
                    ? "focus-on-bright border-paper bg-paper text-deep"
                    : "border-muted-bright/60 text-paper hover:border-paper",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
        {visible.map((nomination) => (
          <li key={nomination.slug}>
            <NominationCard nomination={nomination} live={live} />
          </li>
        ))}
      </ul>
    </>
  );
}
