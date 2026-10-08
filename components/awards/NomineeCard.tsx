import { ArrowUpRight, Send } from "lucide-react";
import Link from "next/link";
import type { Nominee } from "@/lib/data";
import { cn } from "@/lib/cn";
import { plural } from "@/lib/format";
import { isTelegramLink, yearsOnMarket, type LinkButton } from "@/lib/profile";
import { NomineeAvatar } from "./NomineeAvatar";
import { VoteButton } from "@/components/voting/VoteButton";
import { PetalCard } from "./PetalCard";

/** Ссылки участника с подписями. У старых карточек подписей нет — там только сайт и Telegram. */
export function nomineeButtons(nominee: Nominee): LinkButton[] {
  if (nominee.profile.buttons.length > 0) return nominee.profile.buttons;
  return [
    { title: "Сайт", url: nominee.links.site ?? "" },
    { title: "Telegram", url: nominee.links.tg ?? "" },
  ].filter((link) => link.url);
}

/** Ссылки участника кнопками с названиями. limit — сколько показать (в списке место ограничено). */
export function NomineeLinks({ nominee, limit, className }: { nominee: Nominee; limit?: number; className?: string }) {
  const links = nomineeButtons(nominee).slice(0, limit);
  if (links.length === 0) return null;

  return (
    <ul className={cn("relative z-10 flex flex-wrap gap-2", className)}>
      {links.map((link) => {
        const Icon = isTelegramLink(link.url) ? Send : ArrowUpRight;
        return (
          <li key={link.url} className="min-w-0">
            <a
              href={link.url}
              target="_blank"
              rel="noopener nofollow"
              className="flex h-11 items-center gap-2 rounded-full border border-petal bg-deep/40 px-4 font-medium text-paper hover:border-glow hover:bg-glow/20"
            >
              <Icon size={18} strokeWidth={1.75} aria-hidden className="shrink-0" />
              <span className="truncate">{link.title}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/** Короткие факты об участнике: сколько лет на рынке и сколько кейсов он показал. */
export function nomineeFacts(nominee: Nominee): string[] {
  const { foundedYear, cases } = nominee.profile;
  const facts: string[] = [];
  if (foundedYear) {
    const years = yearsOnMarket(foundedYear);
    facts.push(years > 0 ? `${years} ${plural(years, ["год", "года", "лет"])} на рынке` : "Основаны в этом году");
  }
  if (cases.length > 0) facts.push(`${cases.length} ${plural(cases.length, ["кейс", "кейса", "кейсов"])}`);
  return facts;
}

/** Комментарий упомянутой стороны — выводится, если он есть. */
export function RightOfReply({ text }: { text: string }) {
  return (
    <div className="rounded-card border border-petal bg-ink/30 p-4">
      <p className="text-sm font-semibold text-paper">Комментарий стороны</p>
      <p className="mt-1 whitespace-pre-line text-muted-bright">{text}</p>
    </div>
  );
}

type NomineeCardProps = {
  nominee: Nominee;
  nomination: { slug: string; title: string };
  votingOpen: boolean;
};

/** Участник в списке номинации: широкая карточка на всю строку, подробности — на его странице. */
export function NomineeCard({ nominee, nomination, votingOpen }: NomineeCardProps) {
  const facts = nomineeFacts(nominee);
  const href = `/n/${nominee.slug}`;

  return (
    <PetalCard className="flex flex-col gap-5 sm:!p-8">
      <div className="flex items-start gap-4 sm:gap-6">
        <NomineeAvatar name={nominee.name} logoUrl={nominee.logoUrl} size={72} />
        <div className="min-w-0 flex-1">
          <h3 className="break-words font-sans text-xl font-semibold leading-snug text-paper sm:text-2xl">
            <Link href={href} className="hover:underline">
              {nominee.name}
            </Link>
          </h3>
          {nominee.tagline && <p className="mt-1 text-lg text-muted-bright">{nominee.tagline}</p>}
          {facts.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {facts.map((fact) => (
                <li key={fact} className="rounded-full bg-ink/40 px-3 py-1 text-sm font-medium text-paper">
                  {fact}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {nominee.description && <p className="line-clamp-3 whitespace-pre-line break-words text-text">{nominee.description}</p>}

      {nominee.rightOfReply && <RightOfReply text={nominee.rightOfReply} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <NomineeLinks nominee={nominee} limit={3} />
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <Link href={href} className="flex h-11 items-center rounded-full border border-petal px-5 font-semibold text-paper hover:border-glow hover:bg-glow/20">
            Подробнее
          </Link>
          {votingOpen && <VoteButton nominee={{ slug: nominee.slug, name: nominee.name }} nomination={nomination} />}
        </div>
      </div>
    </PetalCard>
  );
}
