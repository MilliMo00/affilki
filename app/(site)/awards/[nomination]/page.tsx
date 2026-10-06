import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/awards/Breadcrumbs";
import { NominationCover } from "@/components/awards/NominationCover";
import { NomineeCard } from "@/components/awards/NomineeCard";
import { LiveBoard } from "@/components/live/LiveBoard";
import { cn } from "@/lib/cn";
import { getLiveSnapshot } from "@/lib/live/snapshot";
import type { LiveNomination } from "@/lib/live/types";
import { PetalIcon } from "@/components/brand/PetalIcon";
import { ShareButton } from "@/components/ui/ShareButton";
import { StoryShare } from "@/components/ui/StoryShare";
import { Tabs } from "@/components/ui/Tabs";
import { getNomination, isVotingOpen, type Nomination, type Season } from "@/lib/data";
import { ADS_CONTACT_URL } from "@/lib/env";
import { formatDate, plural } from "@/lib/format";

type Props = PageProps<"/awards/[nomination]">;

const TABS = [
  { key: "about", label: "О номинации" },
  { key: "nominees", label: "Участники" },
  { key: "live", label: "Live" },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getNomination((await params).nomination);
  if (!data) return {};
  return { title: `${data.nomination.title} — ${data.season.title}`, description: data.nomination.description };
}

function percent(weight: number) {
  return `${Math.round(weight * 100)}%`;
}

function About({ season, nomination }: { season: Season; nomination: Nomination }) {
  const blocks = [
    { title: "Кто участвует", body: <p>{nomination.eligibility}</p> },
    {
      title: "Как считается итог",
      body: (
        <p>
          {season.juryWeight > 0
            ? `${percent(season.communityWeight)} — голоса комьюнити, ${percent(season.juryWeight)} — оценка жюри. `
            : "Побеждает тот, за кого отдано больше голосов. Жюри нет — решает только комьюнити. "}
          Один Telegram-аккаунт — один голос в номинации, изменить его нельзя.
        </p>
      ),
    },
    ...(nomination.jury && season.juryWeight > 0 ? [{ title: "Жюри", body: <p>{nomination.jury}</p> }] : []),
    {
      title: "Даты",
      body: (
        <p>
          Голосование: {formatDate(season.votingStartsAt)} — {formatDate(season.votingEndsAt)}.
        </p>
      ),
    },
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
      <div>
        <p className="max-w-prose text-lg text-paper">{nomination.description}</p>
        <h2 className="mb-4 mt-8 text-xl">Критерии</h2>
        <ul className="space-y-3 text-lg">
          {nomination.criteria.map((item) => (
            <li key={item} className="flex items-baseline gap-3">
              <PetalIcon size={12} filled className="shrink-0 text-paper" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <dl className="space-y-6 rounded-card border border-petal bg-deep/50 p-5 sm:p-6">
        {blocks.map((block) => (
          <div key={block.title}>
            <dt className="font-semibold text-paper">{block.title}</dt>
            <dd className="mt-1 text-muted-bright">{block.body}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

type NomineesProps = {
  nomination: Nomination;
  votingOpen: boolean;
  /** Открытое табло номинации — тогда доступна сортировка по голосам. */
  board: LiveNomination | null;
  byVotes: boolean;
};

function Nominees({ nomination, votingOpen, board, byVotes }: NomineesProps) {
  if (nomination.nominees.length === 0) {
    return <p className="rounded-card border border-petal px-6 py-12 text-center text-lg">Участников пока нет — шорт-лист ещё собирается.</p>;
  }
  // По умолчанию — по алфавиту, чтобы не давать преимущества лидеру.
  const place = new Map(board?.rows.map((row) => [row.slug, row.place]));
  const nominees =
    byVotes && board
      ? [...nomination.nominees].sort((a, b) => (place.get(a.slug) ?? 99) - (place.get(b.slug) ?? 99))
      : nomination.nominees;
  const path = `/awards/${nomination.slug}?tab=nominees`;
  const chip = (active: boolean) =>
    cn(
      "flex h-9 items-center rounded-full border px-4 text-sm font-medium",
      active ? "border-paper bg-paper text-deep" : "border-muted-bright/60 text-paper hover:border-paper",
    );

  return (
    <>
      {board && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-bright">Сортировка:</span>
          <Link href={path} scroll={false} aria-current={!byVotes ? "true" : undefined} className={chip(!byVotes)}>
            По алфавиту
          </Link>
          <Link href={`${path}&sort=votes`} scroll={false} aria-current={byVotes ? "true" : undefined} className={chip(byVotes)}>
            По голосам
          </Link>
        </div>
      )}
      {nomination.isEvents && (
        <p className="mb-8 rounded-card border border-petal bg-deep/50 p-5 text-paper">
          Мы фиксируем события, которые обсуждал рынок. Если вы упомянуты и хотите дать комментарий — напишите{" "}
          <a href={ADS_CONTACT_URL} target="_blank" rel="noopener" className="font-semibold underline underline-offset-4">
            @{ADS_CONTACT_URL.split("/").pop()}
          </a>
          .
        </p>
      )}
      <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {nominees.map((nominee) => (
          <li key={nominee.slug}>
            <NomineeCard nominee={nominee} nomination={{ slug: nomination.slug, title: nomination.title }} votingOpen={votingOpen} />
          </li>
        ))}
      </ul>
    </>
  );
}

export default async function NominationPage({ params, searchParams }: Props) {
  const data = await getNomination((await params).nomination);
  if (!data) notFound();

  const { season, nomination, prev, next } = data;
  const query = await searchParams;
  const requested = query.tab;
  const live = await getLiveSnapshot();
  const liveNomination = live?.nominations.find((n) => n.slug === nomination.slug);
  const board = liveNomination?.state === "live" ? liveNomination : null;
  const tab = TABS.find((t) => t.key === requested)?.key ?? "about";
  const path = `/awards/${nomination.slug}`;
  const count = nomination.nominees.length;
  const noun: [string, string, string] = nomination.isEvents
    ? ["событие", "события", "событий"]
    : ["участник", "участника", "участников"];

  return (
    <div className="bg-indigo">
      <div className="container-page py-10 sm:py-14">
        <Breadcrumbs items={[{ href: "/awards", label: season.title }]} />

        <NominationCover number={nomination.number} icon={nomination.icon} text={nomination.coverText} className="mt-4 h-40 rounded-petal sm:h-52" />

        <header className="mt-6 flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-muted-bright">
              Номинация {nomination.number} из {season.nominations.length} · {count} {plural(count, noun)}
            </p>
            <h1 className="mt-1 hyphens-auto text-xl sm:hyphens-none sm:text-3xl lg:text-4xl">{nomination.title}</h1>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <ShareButton path={path} title={`${nomination.title} — ${season.title}`} label="Поделиться номинацией" />
            <StoryShare path={path} text={`Номинация «${nomination.title}» — ${season.title}`} />
          </div>
        </header>

        <div className="mt-8">
          <Tabs
            tabs={TABS.map((t) => (t.key === "nominees" && nomination.isEvents ? { ...t, label: "События" } : t))}
            active={tab}
            basePath={path}
            label="Разделы номинации"
          />
        </div>

        <div className="mt-8">
          {tab === "about" && <About season={season} nomination={nomination} />}
          {tab === "nominees" && (
            <Nominees nomination={nomination} votingOpen={isVotingOpen(season, nomination)} board={board} byVotes={query.sort === "votes"} />
          )}
          {tab === "live" && <LiveBoard nominationSlug={nomination.slug} initial={live} />}
        </div>

        <nav aria-label="Соседние номинации" className="mt-14 grid gap-4 border-t border-petal pt-6 sm:grid-cols-2">
          {prev ? (
            <Link href={`/awards/${prev.slug}`} className="group flex items-center gap-3 rounded-card p-3 hover:bg-deep/50">
              <ArrowLeft size={20} strokeWidth={1.75} aria-hidden className="shrink-0 text-muted-bright" />
              <span>
                <span className="block text-sm text-muted-bright">Предыдущая номинация</span>
                <span className="font-semibold text-paper group-hover:underline">{prev.title}</span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={`/awards/${next.slug}`} className="group flex items-center justify-end gap-3 rounded-card p-3 text-right hover:bg-deep/50">
              <span>
                <span className="block text-sm text-muted-bright">Следующая номинация</span>
                <span className="font-semibold text-paper group-hover:underline">{next.title}</span>
              </span>
              <ArrowRight size={20} strokeWidth={1.75} aria-hidden className="shrink-0 text-muted-bright" />
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
