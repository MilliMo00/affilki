import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { plural } from "@/lib/format";
import { NominationCover } from "./NominationCover";
import { PetalCard } from "./PetalCard";

export type NominationCardData = {
  slug: string;
  number: number;
  title: string;
  shortDesc: string;
  icon: string;
  nomineeCount: number;
  isEvents: boolean;
};

export function NominationCard({ nomination }: { nomination: NominationCardData }) {
  const count = nomination.nomineeCount;
  const noun = nomination.isEvents ? (["событие", "события", "событий"] as const) : (["участник", "участника", "участников"] as const);

  return (
    <PetalCard className="flex h-full flex-col gap-4 overflow-hidden transition-colors focus-within:border-glow hover:border-glow">
      <NominationCover
        number={nomination.number}
        icon={nomination.icon}
        className="-mx-5 -mt-5 h-36 rounded-[27px_5px_0_0] sm:-mx-6 sm:-mt-6"
      />
      <h3 className="text-xl">
        <Link href={`/awards/${nomination.slug}`} className="after:absolute after:inset-0 after:rounded-petal">
          {nomination.title}
        </Link>
      </h3>
      <p className="text-muted-bright">{nomination.shortDesc}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-2">
        <span className="text-sm text-muted-bright">
          {count} {plural(count, [...noun])}
        </span>
        <span className="inline-flex items-center gap-1.5 font-semibold text-paper" aria-hidden>
          Подробнее
          <ArrowRight size={18} strokeWidth={1.75} />
        </span>
      </div>
    </PetalCard>
  );
}
