import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/awards/Breadcrumbs";
import { NomineeAvatar } from "@/components/awards/NomineeAvatar";
import { NomineeCard, NomineeLinks, RightOfReply } from "@/components/awards/NomineeCard";
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
  const open = isVotingOpen(season, nomination);
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
          <Breadcrumbs
            items={[
              { href: "/awards", label: season.title },
              { href: `/awards/${nomination.slug}?tab=nominees`, label: nomination.title },
            ]}
          />

          <PetalCard className="mx-auto mt-8 max-w-4xl !bg-deep/80 backdrop-blur-sm sm:!p-10">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:gap-7">
              <NomineeAvatar name={nominee.name} logoUrl={nominee.logoUrl} size={112} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-muted-bright">{nomination.title}</p>
                <h1 className="mt-1 break-words text-2xl sm:text-3xl lg:text-4xl">{nominee.name}</h1>
                {nominee.tagline && <p className="mt-3 text-lg text-paper">{nominee.tagline}</p>}
              </div>
            </div>

            {facts.length > 0 && (
              <dl className="mt-7 grid gap-3 sm:grid-cols-3">
                {facts.map((fact) => (
                  <div key={fact.label} className="rounded-card border border-petal/60 bg-ink/30 p-4">
                    <dt className="text-sm text-muted-bright">{fact.label}</dt>
                    <dd className="mt-1 font-display text-2xl font-bold text-paper">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <NomineeLinks nominee={nominee} className="mt-6" />

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-4 border-t border-petal/40 pt-6">
              {open ? (
                <VoteButton
                  nominee={{ slug: nominee.slug, name: nominee.name }}
                  nomination={{ slug: nomination.slug, title: nomination.title }}
                  large
                />
              ) : (
                <p className="text-muted-bright">
                  {new Date() < season.votingStartsAt
                    ? `Голосование начнётся ${formatDate(season.votingStartsAt)}`
                    : `Голосование закончилось ${formatDate(season.votingEndsAt)}`}
                </p>
              )}
              <ShareButton path={voteLink} title={`${nominee.name} — ${season.title}`} label="Скопировать ссылку для голосования" copyOnly />
              <StoryShare
                path={`/n/${nominee.slug}`}
                text={`${nominee.name} в номинации «${nomination.title}» — ${season.title}. ${open ? "Голосуй по ссылке" : "Смотри по ссылке"}`}
              />
            </div>
          </PetalCard>
        </div>
      </section>

      {(blocks.length > 0 || cases.length > 0 || sources.length > 0 || nominee.rightOfReply) && (
        <div className="container-page pt-12">
          <div className="mx-auto max-w-4xl space-y-10">
            {blocks.map((block) => (
              <section key={block.title}>
                <h2 className="text-2xl">{block.title}</h2>
                <p className="mt-4 whitespace-pre-line break-words text-lg text-text">{block.text}</p>
              </section>
            ))}

            {cases.length > 0 && (
              <section aria-labelledby="cases-title">
                <h2 id="cases-title" className="text-2xl">
                  Кейсы
                </h2>
                <ul className="mt-5 grid gap-5 sm:grid-cols-2">
                  {cases.map((item, index) => (
                    <li key={index} className="flex flex-col overflow-hidden rounded-card border border-petal/60 bg-deep/50">
                      {item.imageUrl && (
                        <a href={item.imageUrl} target="_blank" rel="noopener" className="relative block aspect-video bg-ink">
                          <Image src={item.imageUrl} alt={`Кейс: ${item.title}`} fill sizes="(min-width: 640px) 440px, 100vw" className="object-cover" />
                        </a>
                      )}
                      <div className="flex flex-1 flex-col gap-3 p-5">
                        <h3 className="break-words font-sans text-lg font-semibold text-paper">{item.title}</h3>
                        {item.text && <p className="whitespace-pre-line break-words text-text">{item.text}</p>}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener nofollow"
                            className="mt-auto flex h-11 items-center gap-2 self-start rounded-full border border-petal px-4 font-semibold text-paper hover:border-glow hover:bg-glow/20"
                          >
                            Смотреть кейс
                            <ArrowUpRight size={18} strokeWidth={1.75} aria-hidden />
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {sources.length > 0 && (
              <section>
                <h2 className="text-2xl">Источники</h2>
                <ul className="mt-4 space-y-1">
                  {sources.map((source) => (
                    <li key={source}>
                      <a href={source} target="_blank" rel="noopener nofollow" className="break-all text-muted-bright underline underline-offset-4 hover:text-paper">
                        {source}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {nominee.rightOfReply && <RightOfReply text={nominee.rightOfReply} />}
          </div>
        </div>
      )}

      <div className="container-page empty:hidden [&:not(:empty)]:pt-12">
        <LiveBoard nominationSlug={nomination.slug} initial={live} highlight={nominee.slug} quiet title="Позиция в номинации" />
      </div>

      {others.length > 0 && (
        <section aria-labelledby="others-title" className="container-page py-12">
          <h2 id="others-title" className="mx-auto mb-6 max-w-4xl text-2xl">
            {nomination.isEvents ? "Другие события номинации" : "Другие участники номинации"}
          </h2>
          <ul className="mx-auto flex max-w-4xl flex-col gap-6">
            {others.map((other) => (
              <li key={other.slug}>
                <NomineeCard nominee={other} nomination={{ slug: nomination.slug, title: nomination.title }} votingOpen={open} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
