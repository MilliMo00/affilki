import { Globe, Send } from "lucide-react";
import Link from "next/link";
import type { Nominee } from "@/lib/data";
import { NomineeAvatar } from "./NomineeAvatar";
import { VoteButton } from "@/components/voting/VoteButton";
import { PetalCard } from "./PetalCard";

export function NomineeLinks({ nominee }: { nominee: Nominee }) {
  const links = [
    { href: nominee.links.site, label: `Сайт: ${nominee.name}`, Icon: Globe },
    { href: nominee.links.tg, label: `Telegram: ${nominee.name}`, Icon: Send },
  ].filter((link) => link.href);
  if (links.length === 0) return null;

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

/** Комментарий упомянутой стороны — выводится, если он есть. */
export function RightOfReply({ text }: { text: string }) {
  return (
    <div className="rounded-card border border-petal bg-ink/30 p-4">
      <p className="text-sm font-semibold text-paper">Комментарий стороны</p>
      <p className="mt-1 text-muted-bright">{text}</p>
    </div>
  );
}

type NomineeCardProps = {
  nominee: Nominee;
  nomination: { slug: string; title: string };
  votingOpen: boolean;
};

export function NomineeCard({ nominee, nomination, votingOpen }: NomineeCardProps) {
  return (
    <PetalCard className="flex h-full flex-col gap-4">
      <div className="flex items-start gap-4">
        <NomineeAvatar name={nominee.name} logoUrl={nominee.logoUrl} />
        <div className="min-w-0 flex-1">
          <h3 className="font-sans text-lg font-semibold leading-snug text-paper">
            <Link href={`/n/${nominee.slug}`} className="hover:underline">
              {nominee.name}
            </Link>
          </h3>
          <p className="mt-1 text-muted-bright">{nominee.tagline}</p>
        </div>
      </div>

      {nominee.rightOfReply && <RightOfReply text={nominee.rightOfReply} />}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
        <NomineeLinks nominee={nominee} />
        {votingOpen ? (
          <VoteButton
            nominee={{ slug: nominee.slug, name: nominee.name }}
            nomination={nomination}
            className="ml-auto"
          />
        ) : (
          <Link
            href={`/n/${nominee.slug}`}
            className="ml-auto flex h-11 items-center rounded-full border border-petal px-5 font-semibold text-paper hover:border-glow hover:bg-glow/20"
          >
            Подробнее
          </Link>
        )}
      </div>
    </PetalCard>
  );
}
