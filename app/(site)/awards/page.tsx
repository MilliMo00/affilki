import type { Metadata } from "next";
import { SeasonView } from "@/components/awards/SeasonView";
import { Watermark } from "@/components/brand/Watermark";
import { Button } from "@/components/ui/Button";
import { getCurrentSeason, getSeasons } from "@/lib/data";
import { TG_CHANNEL_URL } from "@/lib/env";

export const metadata: Metadata = {
  title: "Премия",
  description: "AFFILKI Awards — народная премия арбитражного рынка. Номинации, участники и честное голосование.",
};

// Этап, таймер и «дней до финала» зависят от текущего времени — страницу нельзя замораживать при сборке.
export const dynamic = "force-dynamic";

export default async function AwardsPage() {
  const [season, seasons] = await Promise.all([getCurrentSeason(), getSeasons()]);

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

  return <SeasonView season={season} otherSeasons={seasons.filter((s) => s.year !== season.year)} />;
}
