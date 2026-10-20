import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/awards/Breadcrumbs";
import { NomineeAvatar } from "@/components/awards/NomineeAvatar";
import { CaseCard } from "@/components/awards/CaseCard";
import { NomineeLinks, NomineeMiniCard, RightOfReply, nomineeButtons } from "@/components/awards/NomineeCard";
import { SponsorStrip } from "@/components/awards/Sponsors";
import { PetalCard } from "@/components/awards/PetalCard";
import { Watermark } from "@/components/brand/Watermark";
import { Snowfall } from "@/components/festive/Snowfall";
import { LiveBoard } from "@/components/live/LiveBoard";
import { LiveTickerSlot } from "@/components/live/LiveTickerSlot";
import { getLiveSnapshot } from "@/lib/live/snapshot";
import { ShareButton } from "@/components/ui/ShareButton";
import { StoryShare } from "@/components/ui/StoryShare";
import { VoteButton } from "@/components/voting/VoteButton";
import { getNominee, isVotingOpen } from "@/lib/data";
import { formatDate, plural } from "@/lib/format";
import { yearsOnMarket } from "@/lib/profile";

type Props = PageProps<"/n/[nominee]">;

/** Сколько других участников видно сразу; остальные свёрнуты. */
const OTHERS_SHOWN = 4;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getNominee((await params).nominee);
  if (!data) return {};
  const title = `${data.nominee.name} в номинации «${data.nomination.title}» — ${data.season.title}`;
  return { title: { absolute: title }, description: data.nominee.tagline };
}

export default async function NomineePage({ params }: Props) {
  const data = await getNominee((await params).nominee);
  if (!data) notFound();

  const { season, nomination, nominee } = data;
  const open = isVotingOpen(season);
  const others = nomination.nominees.filter((n) => n.slug !== nominee.slug);
  const live = await getLiveSnapshot();
  const { foundedYear, achievements, whyVote, cases } = nominee.profile;
  const years = foundedYear ? yearsOnMarket(foundedYear) : 0;
  const facts = [
    foundedYear && { label: "Год основания", value: String(foundedYear) },
    foundedYear && years > 0 && { label: "На рынке", value: `${years} ${plural(years, ["год", "года", "лет"])}` },
    cases.length > 0 && { label: "Кейсов показано", value: String(cases.length) },
  ].filter((fact): fact is { label: string; value: string } => !!fact);
  // Источники показываются только у событий: у остальных ссылки уже стоят кнопками в шапке.
  const sources = nomination.isEvents ? nominee.sources : [];
  // Текст участника разбит на блоки — так карточки удобно сравнивать между собой.
  const blocks = [
    { title: nomination.isEvents ? "Что произошло" : "О команде", text: nominee.description ?? "" },
    { title: "Что сделали за год", text: achievements },
    { title: "Почему голосовать за нас", text: whyVote },
  ].filter((block) => block.text);
  const voteLink = `/n/${nominee.slug}?utm_source=share&utm_medium=nominee&utm_campaign=awards${season.year}`;

  return (
    <div className="bg-indigo">
      <LiveTickerSlot />
      <section className="grain relative overflow-hidden bg-hero">
        <Watermark />
        <Snowfall density={0.6} />
        <div className="container-page relative py-10 sm:py-14">
          <SponsorStrip compact className="mb-6" />
          <Breadcrumbs
            items={[
              { href: "/awards", label: season.title },
              { href: `/awards/${nomination.slug}?tab=nominees`, label: nomination.title },
            ]}
          />

          <PetalCard className="mt-8 !bg-deep/80 backdrop-blur-sm sm:!p-10">
            <div className="flex flex-col gap-7">
              <div className="flex min-w-0 flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-7">
                <NomineeAvatar name={nominee.name} logoUrl={nominee.logoUrl} size={128} />
                <div className="min-w-0">
                  <Link href={`/awards/${nomination.slug}`} className="inline-flex rounded-full border border-petal/70 px-3 py-1 text-sm font-medium text-muted-bright hover:border-paper hover:text-paper">
                    {nomination.title}
                  </Link>
                  <h1 className="mt-3 break-words text-2xl sm:text-4xl lg:text-5xl">{nominee.name}</h1>
                  {nominee.tagline && <p className="mt-3 max-w-2xl text-lg text-paper">{nominee.tagline}</p>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 border-t border-petal/40 pt-6">
                {open ? (
                  <VoteButton nominee={{ slug: nominee.slug, name: nominee.name }} nomination={{ slug: nomination.slug, title: nomination.title }} large />
                ) : (
                  <p className="rounded-full border border-petal/60 px-4 py-2 text-muted-bright">
                    {new Date() < season.votingStartsAt
                      ? `Голосование начнётся ${formatDate(season.votingStartsAt)}`
                      : `Голосование закончилось ${formatDate(season.votingEndsAt)}`}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 sm:ml-auto">
                  <ShareButton path={voteLink} title={`${nominee.name} — ${season.title}`} label="Скопировать ссылку" copyOnly />
                  <StoryShare
                    path={`/n/${nominee.slug}`}
                    text={`${nominee.name} в номинации «${nomination.title}» — ${season.title}. ${open ? "Голосуй по ссылке" : "Смотри по ссылке"}`}
                  />
                </div>
              </div>
            </div>
          </PetalCard>
        </div>
      </section>

      <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-8 pt-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="space-y-6">
          {blocks.map((block, index) => (
            <section key={block.title} className="rounded-petal border border-petal/60 bg-deep/40 p-6 sm:p-8">
              <p className="font-display text-sm font-bold text-muted-bright">0{index + 1}</p>
              <h2 className="mt-1 text-2xl">{block.title}</h2>
              <p className="mt-4 whitespace-pre-line break-words text-lg leading-relaxed text-text">{block.text}</p>
            </section>
          ))}
          {blocks.length === 0 && <p className="rounded-petal border border-petal/60 bg-deep/40 p-6 text-muted-bright">Участник пока не рассказал о себе.</p>}
          {nominee.rightOfReply && <RightOfReply text={nominee.rightOfReply} />}
        </div>

        {/* Коротко об участнике: факты, ссылки, позиция — всегда под рукой при прокрутке. */}
        <aside aria-label="Коротко" className="space-y-6 lg:sticky lg:top-24">
          {facts.length > 0 && (
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              {facts.map((fact) => (
                <div key={fact.label} className="rounded-card border border-petal/60 bg-ink/30 p-4">
                  <dt className="text-sm text-muted-bright">{fact.label}</dt>
                  <dd className="mt-1 font-display text-2xl font-bold text-paper">{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {nomineeButtons(nominee).length > 0 && (
            <div className="rounded-card border border-petal/60 bg-deep/40 p-4">
              <p className="mb-3 text-sm font-semibold text-muted-bright">Ссылки</p>
              <NomineeLinks nominee={nominee} />
            </div>
          )}
          {sources.length > 0 && (
            <div className="rounded-card border border-petal/60 bg-deep/40 p-4">
              <p className="mb-2 text-sm font-semibold text-muted-bright">Источники</p>
              <ul className="space-y-1">
                {sources.map((source) => (
                  <li key={source}>
                    <a href={source} target="_blank" rel="noopener nofollow" className="break-all text-sm text-muted-bright underline underline-offset-4 hover:text-paper">
                      {source}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <LiveBoard nominationSlug={nomination.slug} initial={live} highlight={nominee.slug} quiet title="Позиция в номинации" />
        </aside>
      </div>

      {cases.length > 0 && (
        <section aria-labelledby="cases-title" className="container-page pt-12">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="cases-title" className="text-2xl sm:text-3xl">
              Кейсы
            </h2>
            <p className="text-muted-bright">
              {cases.length} {plural(cases.length, ["кейс", "кейса", "кейсов"])}
            </p>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((item, index) => (
              <li key={index}>
                <CaseCard item={item} number={index + 1} href={`/n/${nominee.slug}/cases/${index + 1}`} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {others.length > 0 && (
        <section aria-labelledby="others-title" className="container-page py-12">
          <div>
            <h2 id="others-title" className="mb-6 text-2xl">
              {nomination.isEvents ? "Другие события номинации" : "Другие участники номинации"}
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {others.slice(0, OTHERS_SHOWN).map((other) => (
                <li key={other.slug}>
                  <NomineeMiniCard nominee={other} />
                </li>
              ))}
            </ul>
            {others.length > OTHERS_SHOWN && (
              <details className="group mt-4">
                <summary className="flex h-11 w-fit cursor-pointer list-none items-center gap-2 rounded-full border border-petal px-5 font-semibold text-paper hover:border-glow hover:bg-glow/20 [&::-webkit-details-marker]:hidden">
                  <span className="group-open:hidden">Показать ещё {others.length - OTHERS_SHOWN}</span>
                  <span className="hidden group-open:inline">Свернуть</span>
                  <ChevronDown size={18} strokeWidth={1.75} aria-hidden className="transition-transform group-open:rotate-180" />
                </summary>
                <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {others.slice(OTHERS_SHOWN).map((other) => (
                    <li key={other.slug}>
                      <NomineeMiniCard nominee={other} />
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
