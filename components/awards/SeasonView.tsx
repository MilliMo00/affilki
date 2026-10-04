import Link from "next/link";
import { AdSlot } from "@/components/ads/AdSlot";
import type { Season } from "@/lib/data";
import { HowWeVote } from "./HowWeVote";
import { NominationGrid } from "./NominationGrid";
import { SeasonHero } from "./SeasonHero";

type SeasonViewProps = { season: Season; otherSeasons: Season[] };

/** Страница сезона: общая для /awards (текущий) и /awards/[season] (архив). */
export function SeasonView({ season, otherSeasons }: SeasonViewProps) {
  return (
    <div className="bg-indigo">
      <SeasonHero season={season} ctaHref="#nominations" />
      {!season.resultsPublished && <HowWeVote />}

      <section id="nominations" aria-labelledby="nominations-title" className="container-page scroll-mt-20 pb-16 pt-4">
        <AdSlot slotKey="awards_top" onBrand className="mb-10" />
        <h2 id="nominations-title" className="mb-6 text-2xl">
          {season.resultsPublished ? "Итоги по номинациям" : "Номинации"}
        </h2>
        <NominationGrid season={season} />
      </section>

      {otherSeasons.length > 0 && (
        <section id="archive" aria-labelledby="archive-title" className="scroll-mt-20 border-t border-petal/50 bg-deep">
          <div className="container-page py-12">
            <h2 id="archive-title" className="mb-6 text-2xl">
              Другие сезоны
            </h2>
            <ul className="flex flex-wrap gap-3">
              {otherSeasons.map((other) => (
                <li key={other.year}>
                  <Link
                    href={`/awards/${other.year}`}
                    className="flex h-11 items-center rounded-full border border-petal px-5 font-medium text-paper hover:border-glow hover:bg-glow/20"
                  >
                    {other.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
