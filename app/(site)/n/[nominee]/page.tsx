import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/awards/Breadcrumbs";
import { NomineeAvatar } from "@/components/awards/NomineeAvatar";
import { NomineeCard, NomineeLinks, RightOfReply } from "@/components/awards/NomineeCard";
import { PetalCard } from "@/components/awards/PetalCard";
import { Watermark } from "@/components/brand/Watermark";
import { LiveBoard } from "@/components/live/LiveBoard";
import { LiveTickerSlot } from "@/components/live/LiveTickerSlot";
import { getLiveSnapshot } from "@/lib/live/snapshot";
import { ShareButton } from "@/components/ui/ShareButton";
import { VoteButton } from "@/components/voting/VoteButton";
import { getNominee, isVotingOpen } from "@/lib/data";
import { formatDate } from "@/lib/format";

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
  const voteLink = `/n/${nominee.slug}?utm_source=share&utm_medium=nominee&utm_campaign=awards${season.year}`;

  return (
    <div className="bg-indigo">
      <LiveTickerSlot />
      <section className="grain relative overflow-hidden bg-hero">
        <Watermark />
        <div className="container-page relative py-10 sm:py-14">
          <Breadcrumbs
            items={[
              { href: "/awards", label: season.title },
              { href: `/awards/${nomination.slug}?tab=nominees`, label: nomination.title },
            ]}
          />

          <PetalCard className="mx-auto mt-8 flex max-w-2xl flex-col items-center gap-5 !bg-deep/80 text-center backdrop-blur-sm sm:!p-10">
            <NomineeAvatar name={nominee.name} logoUrl={nominee.logoUrl} size={96} />
            <div>
              <h1 className="text-2xl sm:text-3xl">{nominee.name}</h1>
              <p className="mt-3 text-lg text-paper">{nominee.tagline}</p>
            </div>
            {nominee.description && <p className="text-muted-bright">{nominee.description}</p>}
            <NomineeLinks nominee={nominee} />

            {nominee.sources.length > 0 && (
              <div className="w-full text-left">
                <p className="text-sm font-semibold text-paper">Источники</p>
                <ul className="mt-1 space-y-1">
                  {nominee.sources.map((source) => (
                    <li key={source}>
                      <a href={source} target="_blank" rel="noopener nofollow" className="break-all text-muted-bright underline underline-offset-4 hover:text-paper">
                        {source}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {nominee.rightOfReply && (
              <div className="w-full text-left">
                <RightOfReply text={nominee.rightOfReply} />
              </div>
            )}

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
          </PetalCard>
        </div>
      </section>

      <div className="container-page empty:hidden [&:not(:empty)]:pt-12">
        <LiveBoard nominationSlug={nomination.slug} initial={live} highlight={nominee.slug} quiet title="Позиция в номинации" />
      </div>

      {others.length > 0 && (
        <section aria-labelledby="others-title" className="container-page py-12">
          <h2 id="others-title" className="mb-6 text-2xl">
            {nomination.isEvents ? "Другие события номинации" : "Другие участники номинации"}
          </h2>
          <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
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
