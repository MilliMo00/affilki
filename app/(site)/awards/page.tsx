import type { Metadata } from "next";
import { AdSlot } from "@/components/ads/AdSlot";
import { HowWeVote } from "@/components/awards/HowWeVote";
import { NominationHub } from "@/components/awards/NominationHub";
import { SeasonHero } from "@/components/awards/SeasonHero";
import { SponsorCall } from "@/components/awards/SponsorCall";
import { WinnerPrize } from "@/components/awards/WinnerPrize";
import { SponsorStrip } from "@/components/awards/Sponsors";
import { Watermark } from "@/components/brand/Watermark";
import { Button } from "@/components/ui/Button";
import { toHubNomination } from "@/lib/awards";
import { getCurrentSeason, getOpenNominations } from "@/lib/data";
import { getLiveSnapshot } from "@/lib/live/snapshot";
import { getSponsors } from "@/lib/sponsors";
import { TG_CHANNEL_URL } from "@/lib/env";

export const metadata: Metadata = {
  title: "Премия",
  description: "AFFILKI Awards — народная премия арбитражного рынка. Номинации, участники и честное голосование.",
};

// Этап и таймер зависят от текущего времени — страницу нельзя замораживать при сборке.
export const dynamic = "force-dynamic";

export default async function AwardsPage() {
  const [season, live, open, sponsors] = await Promise.all([getCurrentSeason(), getLiveSnapshot(), getOpenNominations(), getSponsors()]);

  if (!season) {
    return (
      <section className="grain relative overflow-hidden bg-hero">
        <Watermark />
        <div className="container-page relative flex min-h-[60dvh] flex-col items-center justify-center gap-6 py-20 text-center">
          <h1 className="text-3xl sm:text-4xl">Премия скоро</h1>
          <p className="max-w-xl text-lg text-paper">Сезон ещё не открыт. Подпишись на канал — напишем, когда начнём принимать заявки.</p>
          <Button href={TG_CHANNEL_URL} size="lg">
            Подписаться на канал
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="bg-indigo">
      <SeasonHero season={season} live={live} acceptingEntries={open.length > 0} nominationsHref="#nominations" />

      <SponsorStrip className="container-page pt-10" />

      <section id="nominations" aria-labelledby="nominations-title" className="container-page scroll-mt-20 pb-6 pt-10">
        <AdSlot slotKey="awards_top" onBrand className="mb-10" />
        <h2 id="nominations-title" className="mb-6 text-2xl">
          Номинации
        </h2>
        <NominationHub nominations={season.nominations.map((n) => toHubNomination(n, sponsors.byNomination.get(n.slug)))} live={live} />
      </section>

      <WinnerPrize year={season.year} />
      <HowWeVote />
      <SponsorCall />
    </div>
  );
}
