import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/awards/Breadcrumbs";
import { NomineeAvatar } from "@/components/awards/NomineeAvatar";
import { NomineeCard, NomineeLinks } from "@/components/awards/NomineeCard";
import { PetalCard } from "@/components/awards/PetalCard";
import { VoteButton } from "@/components/awards/VoteButton";
import { VoteStatus } from "@/components/awards/VoteStatus";
import { WinnerBurst } from "@/components/awards/WinnerBurst";
import { Watermark } from "@/components/brand/Watermark";
import { ShareButton } from "@/components/ui/ShareButton";
import { getNominee, isVotingOpen, nominationId } from "@/lib/data";
import { formatDate } from "@/lib/format";

type Props = PageProps<"/n/[nominee]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getNominee((await params).nominee);
  if (!data) return {};
  const title = `${data.nominee.name} в номинации «${data.nomination.title}» — ${data.season.title}`;
  return { title: { absolute: title }, description: `${data.nominee.tagline}. Поддержи голосом на AFFILKI Awards.` };
}

export default async function NomineePage({ params }: Props) {
  const data = await getNominee((await params).nominee);
  if (!data) notFound();

  const { season, nomination, nominee } = data;
  const open = isVotingOpen(season);
  const id = nominationId(season, nomination);
  const { result } = nominee;
  const others = nomination.nominees.filter((n) => n.slug !== nominee.slug);
  const names = Object.fromEntries(nomination.nominees.map((n) => [n.slug, n.name]));

  return (
    <div className="bg-indigo">
      <section className="grain relative overflow-hidden bg-hero">
        <Watermark />
        <div className="container-page relative py-10 sm:py-14">
          <Breadcrumbs
            items={[
              { href: `/awards/${season.year}`, label: season.title },
              { href: `/awards/${season.year}/${nomination.slug}`, label: nomination.title },
            ]}
          />

          <PetalCard
            tone={result ? (result.place === 1 ? "winner" : "finalist") : "default"}
            className="mx-auto mt-8 flex max-w-2xl flex-col items-center gap-5 !bg-deep/80 text-center backdrop-blur-sm sm:!p-10"
          >
            {result?.place === 1 && <WinnerBurst id={`${id}:${nominee.slug}`} />}
            <NomineeAvatar name={nominee.name} logoUrl={nominee.logoUrl} size={96} />
            <div>
              <h1 className="text-3xl sm:text-4xl">{nominee.name}</h1>
              <p className="mt-3 text-lg text-paper">{nominee.tagline}</p>
            </div>
            <NomineeLinks nominee={nominee} />

            {result ? (
              <p className="font-display text-xl font-bold text-paper">
                {result.place} место · {result.percent}%
              </p>
            ) : open ? (
              <>
                <VoteButton nominationId={id} nomineeSlug={nominee.slug} nomineeName={nominee.name} large />
                <VoteStatus nominationId={id} nomineeSlug={nominee.slug} names={names} />
              </>
            ) : (
              <p className="text-muted-bright">
                {new Date() < season.votingStartsAt
                  ? `Голосование начнётся ${formatDate(season.votingStartsAt)}`
                  : `Голосование закончилось ${formatDate(season.votingEndsAt)}`}
              </p>
            )}

            <ShareButton path={`/n/${nominee.slug}`} title={`${nominee.name} — ${season.title}`} />
          </PetalCard>
        </div>
      </section>

      {others.length > 0 && (
        <section aria-labelledby="others-title" className="container-page py-12">
          <h2 id="others-title" className="mb-6 text-2xl">
            Другие участники номинации
          </h2>
          <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((other) => (
              <li key={other.slug}>
                <NomineeCard nominee={other} nominationId={id} votingOpen={open} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
