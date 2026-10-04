import type { Season } from "@/lib/data";
import { NominationCard } from "./NominationCard";

export function NominationGrid({ season }: { season: Season }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {season.nominations.map((nomination) => (
        <li key={nomination.slug}>
          <NominationCard season={season} nomination={nomination} />
        </li>
      ))}
    </ul>
  );
}
