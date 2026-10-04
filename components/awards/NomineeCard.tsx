import { Globe, Send } from "lucide-react";
import Link from "next/link";
import type { Nominee } from "@/lib/data";
import { NomineeAvatar } from "./NomineeAvatar";
import { PetalCard } from "./PetalCard";
import { VoteButton } from "./VoteButton";
import { WinnerBurst } from "./WinnerBurst";

type NomineeCardProps = {
  nominee: Nominee;
  nominationId: string;
  votingOpen: boolean;
};

export function NomineeLinks({ nominee }: { nominee: Nominee }) {
  const links = [
    { href: nominee.links.site, label: `Сайт ${nominee.name}`, Icon: Globe },
    { href: nominee.links.tg, label: `Telegram ${nominee.name}`, Icon: Send },
  ].filter((link) => link.href);

  return (
    <div className="relative z-10 flex gap-1">
      {links.map(({ href, label, Icon }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noopener nofollow"
          aria-label={label}
          className="flex size-11 items-center justify-center rounded-full text-muted-bright hover:bg-paper/10 hover:text-paper"
        >
          <Icon size={20} strokeWidth={1.75} aria-hidden />
        </a>
      ))}
    </div>
  );
}

export function NomineeCard({ nominee, nominationId, votingOpen }: NomineeCardProps) {
  const { result } = nominee;
  const tone = result ? (result.place === 1 ? "winner" : "finalist") : "default";

  return (
    <PetalCard tone={tone} className="flex h-full flex-col gap-4">
      {result?.place === 1 && <WinnerBurst id={`${nominationId}:${nominee.slug}`} />}
      <div className="flex items-start gap-4">
        <NomineeAvatar name={nominee.name} logoUrl={nominee.logoUrl} />
        <div className="min-w-0 flex-1">
          <h3 className="text-xl">
            <Link href={`/n/${nominee.slug}`} className="hover:underline">
              {nominee.name}
            </Link>
          </h3>
          <p className="mt-1 text-muted-bright">{nominee.tagline}</p>
        </div>
      </div>

      {result && (
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-muted-bright">{result.place} место</span>
            <span className="font-display text-xl font-bold tabular-nums text-paper">{result.percent}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/50">
            <div
              className={result.place === 1 ? "h-full rounded-full bg-pollen" : "h-full rounded-full bg-paper"}
              style={{ width: `${result.percent}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
        <NomineeLinks nominee={nominee} />
        {votingOpen && (
          <VoteButton nominationId={nominationId} nomineeSlug={nominee.slug} nomineeName={nominee.name} />
        )}
      </div>
    </PetalCard>
  );
}
