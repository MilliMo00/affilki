import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/awards/Breadcrumbs";
import { NomineeCard } from "@/components/awards/NomineeCard";
import { ShareButton } from "@/components/ui/ShareButton";
import { getNomination, isVotingOpen, nominationId } from "@/lib/data";
import { formatDate } from "@/lib/format";

type Props = PageProps<"/awards/[season]/[nom]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { season, nom } = await params;
  const data = await getNomination(Number(season), nom);
  if (!data) return {};
  return {
    title: `${data.nomination.title} — ${data.season.title}`,
    description: data.nomination.description,
  };
}

export default async function NominationPage({ params }: Props) {
  const { season: year, nom } = await params;
  const data = await getNomination(Number(year), nom);
  if (!data) notFound();

  const { season, nomination } = data;
  const open = isVotingOpen(season);
  const id = nominationId(season, nomination);
  const path = `/awards/${season.year}/${nomination.slug}`;
  // Места показываем только после публикации итогов; до этого порядок нейтральный.
  const nominees = season.resultsPublished
    ? [...nomination.nominees].sort((a, b) => (a.result?.place ?? 99) - (b.result?.place ?? 99))
    : nomination.nominees;

  return (
    <div className="bg-indigo">
      <div className="container-page py-10 sm:py-14">
        <Breadcrumbs items={[{ href: `/awards/${season.year}`, label: season.title }]} />
        <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl">{nomination.title}</h1>
            <p className="mt-4 text-lg text-paper">{nomination.description}</p>
          </div>
          <ShareButton path={path} title={`${nomination.title} — ${season.title}`} label="Поделиться номинацией" />
        </div>

        <dl className="mt-8 grid gap-6 rounded-card border border-petal bg-deep/50 p-5 sm:grid-cols-[2fr_1fr]">
          <div>
            <dt className="font-semibold text-paper">Критерии</dt>
            <dd className="mt-1 text-muted-bright">{nomination.criteria}</dd>
          </div>
          <div>
            <dt className="font-semibold text-paper">Голосование</dt>
            <dd className="mt-1 text-muted-bright">
              {season.resultsPublished
                ? "Итоги опубликованы"
                : open
                  ? `Открыто до ${formatDate(season.votingEndsAt)}`
                  : new Date() < season.votingStartsAt
                    ? `Начнётся ${formatDate(season.votingStartsAt)}`
                    : `Закончилось ${formatDate(season.votingEndsAt)}`}
            </dd>
          </div>
        </dl>

        <h2 className="mb-6 mt-12 text-2xl">{season.resultsPublished ? "Итоги" : "Участники"}</h2>
        <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {nominees.map((nominee) => (
            <li key={nominee.slug}>
              <NomineeCard nominee={nominee} nominationId={id} votingOpen={open} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
