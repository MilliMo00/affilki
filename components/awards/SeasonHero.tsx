import { Watermark } from "@/components/brand/Watermark";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import type { Season } from "@/lib/data";
import { Countdown } from "./Countdown";
import { StageIndicator } from "./StageIndicator";

type SeasonHeroProps = {
  season: Season;
  /** Главная кнопка; без неё кнопка не показывается. */
  cta?: { href: string; label: string };
};

export function SeasonHero({ season, cta }: SeasonHeroProps) {
  const now = new Date();
  const notStarted = now < season.votingStartsAt;
  const ended = now > season.votingEndsAt;

  return (
    <section className="grain relative overflow-hidden bg-hero">
      <Watermark />
      <div className="container-page relative flex flex-col items-center gap-8 py-14 text-center sm:py-20">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl">{season.title}</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-paper">
            Народная премия арбитражного рынка. Победителей выбирает комьюнити.
          </p>
        </div>

        <div className="flex w-full max-w-3xl flex-col items-center gap-6 rounded-petal border border-petal/60 bg-deep/60 p-5 backdrop-blur-sm sm:p-6 md:flex-row md:justify-between md:text-left">
          <StageIndicator stage={season.stage} nextDate={season.nextStageAt ?? undefined} className="text-left" />
          {ended ? (
            <p className="text-muted-bright">
              {season.resultsPublished
                ? "Сезон завершён, итоги опубликованы"
                : `Голосование закончилось ${formatDate(season.votingEndsAt)}`}
            </p>
          ) : (
            <Countdown
              to={(notStarted ? season.votingStartsAt : season.votingEndsAt).toISOString()}
              label={notStarted ? "До старта голосования" : "До конца голосования"}
            />
          )}
        </div>

        {cta && (
          <Button href={cta.href} size="lg">
            {cta.label}
          </Button>
        )}
      </div>
    </section>
  );
}
