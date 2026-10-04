import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeasonView } from "@/components/awards/SeasonView";
import { getSeason, getSeasons } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/awards/[season]">): Promise<Metadata> {
  const season = await getSeason(Number((await params).season));
  if (!season) return {};
  return { title: season.title, description: `${season.title}: номинации, участники и итоги голосования.` };
}

export default async function SeasonPage({ params }: PageProps<"/awards/[season]">) {
  const year = Number((await params).season);
  const [season, seasons] = await Promise.all([getSeason(year), getSeasons()]);
  if (!season) notFound();

  return <SeasonView season={season} otherSeasons={seasons.filter((s) => s.year !== season.year)} />;
}
