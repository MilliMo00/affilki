import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/awards/Breadcrumbs";
import { LiveRows } from "@/components/live/LiveRows";
import { db } from "@/lib/db";
import { computeSnapshot } from "@/lib/live/snapshot";

type Props = PageProps<"/awards/archive/[year]">;

// Архив — только сезоны с опубликованными итогами.
async function archivedSeason(yearParam: string) {
  const year = Number(yearParam);
  if (!Number.isInteger(year)) return null;
  return db.season.findFirst({ where: { year, resultsPublished: true } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const season = await archivedSeason((await params).year);
  return season ? { title: `${season.title} — итоги`, description: `Итоги голосования ${season.title} по всем номинациям.` } : {};
}

export default async function ArchivePage({ params }: Props) {
  const season = await archivedSeason((await params).year);
  if (!season) notFound();
  const results = await computeSnapshot(season);

  return (
    <div className="bg-indigo">
      <div className="container-page py-10 sm:py-14">
        <Breadcrumbs items={[{ href: "/awards", label: "Премия" }]} />
        <h1 className="mt-4 text-3xl sm:text-4xl">{season.title} — итоги</h1>
        <ul className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {results.nominations.map((nomination) => (
            <li key={nomination.slug} className="rounded-petal border border-petal bg-surface p-5">
              <h2 className="mb-4 font-sans text-lg font-semibold">{nomination.title}</h2>
              <LiveRows rows={nomination.rows} final compact />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
