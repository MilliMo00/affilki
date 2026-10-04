import Link from "next/link";
import { nominationId, type Nomination, type Season } from "@/lib/data";
import { plural } from "@/lib/format";
import { NomineeAvatar } from "./NomineeAvatar";
import { PetalCard } from "./PetalCard";
import { VotedMark } from "./VotedMark";

export function NominationCard({ season, nomination }: { season: Season; nomination: Nomination }) {
  const count = nomination.nominees.length;
  // До публикации итогов порядок участников ничего не значит — проценты и места не показываем.
  const preview = nomination.nominees.slice(0, 3);

  return (
    <PetalCard className="flex h-full flex-col gap-4 transition-colors focus-within:border-glow hover:border-glow">
      <h3 className="text-xl">
        <Link href={`/awards/${season.year}/${nomination.slug}`} className="after:absolute after:inset-0 after:rounded-petal">
          {nomination.title}
        </Link>
      </h3>
      <p className="line-clamp-2 text-muted-bright">{nomination.description}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {preview.map((nominee) => (
              <NomineeAvatar key={nominee.slug} name={nominee.name} logoUrl={nominee.logoUrl} size={40} />
            ))}
          </div>
          <span className="text-sm text-muted-bright">
            {count} {plural(count, ["участник", "участника", "участников"])}
          </span>
        </div>
        <VotedMark nominationId={nominationId(season, nomination)} />
      </div>
    </PetalCard>
  );
}
