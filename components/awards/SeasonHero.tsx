import { Gift } from "lucide-react";
import { Flower } from "@/components/brand/Flower";
import { Watermark } from "@/components/brand/Watermark";
import { Snowfall } from "@/components/festive/Snowfall";
import { isFestive } from "@/lib/festive";
import { LiveTotal } from "@/components/live/LiveBits";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Season } from "@/lib/data";
import { formatDate, plural } from "@/lib/format";
import type { LiveSnapshot } from "@/lib/live/types";
import { STAGES, stageNumber } from "@/lib/stages";
import { Countdown } from "./Countdown";

type SeasonHeroProps = {
  season: Season;
  /** Открыт ли приём заявок хотя бы в одну номинацию. */
  acceptingEntries: boolean;
  /** Куда ведёт «Смотреть номинации»: на хабе — якорь, на главной — страница премии. */
  nominationsHref: string;
  /** Снимок live — для общего счётчика голосов. */
  live?: LiveSnapshot | null;
};

type Phase = "before" | "voting" | "after";

/** Главный экран сезона: что происходит сейчас, что можно сделать и ключевые даты. */
export function SeasonHero({ season, acceptingEntries, nominationsHref, live }: SeasonHeroProps) {
  const now = new Date();
  const phase: Phase = now < season.votingStartsAt ? "before" : now > season.votingEndsAt ? "after" : "voting";
  const count = season.nominations.length;

  const status =
    phase === "voting"
      ? "Голосование идёт"
      : phase === "after"
        ? season.resultsPublished
          ? "Итоги объявлены"
          : "Голосование завершено"
        : acceptingEntries
          ? "Приём заявок открыт"
          : "Скоро голосование";

  // Три ключевые даты сезона. Это настоящая последовательность, поэтому она оформлена шагами.
  const steps = [
    {
      key: "before",
      date: phase === "before" ? "Сейчас" : `до ${formatDate(season.votingStartsAt)}`,
      title: "Приём заявок",
      text: "Подай команду, сервис, канал или событие в номинацию. Редактор ответит в боте.",
    },
    {
      key: "voting",
      date: formatDate(season.votingStartsAt),
      title: "Голосование",
      text: "Один голос в каждой номинации. Решает только комьюнити — жюри нет.",
    },
    {
      key: "after",
      date: formatDate(season.votingEndsAt),
      title: "Итоги",
      text: isFestive(season.votingEndsAt) ? "Победителей объявим под самый Новый год — в день окончания голосования." : "Объявляем победителей в день окончания голосования.",
      gift: isFestive(season.votingEndsAt),
    },
  ] as const;

  const primary =
    phase === "voting"
      ? { href: nominationsHref, label: "Голосовать" }
      : phase === "after"
        ? { href: season.resultsPublished ? "/awards/live" : nominationsHref, label: season.resultsPublished ? "Смотреть итоги" : "Смотреть номинации" }
        : acceptingEntries
          ? { href: "/submit", label: "Подать заявку" }
          : { href: nominationsHref, label: "Смотреть номинации" };
  const secondary = primary.href === nominationsHref ? null : { href: nominationsHref, label: "Смотреть номинации" };

  return (
    <section className="grain relative overflow-hidden bg-hero">
      <Watermark />
      <Snowfall />
      <div className="container-page relative flex flex-col items-center gap-8 py-12 text-center sm:py-16">
        <p className="inline-flex items-center gap-3 rounded-full border border-paper/50 bg-deep/60 py-1.5 pl-2 pr-4 font-semibold text-paper backdrop-blur-sm">
          {/* Цветок-индикатор: закрашено столько лепестков, сколько этапов сезона начато. */}
          <Flower size={28} filled={stageNumber(season.stage)} rays={false} rayColor="var(--deep)" title={`Этап ${stageNumber(season.stage)} из ${STAGES.length}`} />
          {status}
        </p>

        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl">{season.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-paper">
            Народная премия арбитражного рынка. {count} {plural(count, ["номинация", "номинации", "номинаций"])}, победителей выбирает
            комьюнити.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button href={primary.href} size="lg">
            {primary.label}
          </Button>
          {secondary && (
            <Button href={secondary.href} size="lg" variant="secondary" className="border-paper/70 bg-deep/40">
              {secondary.label}
            </Button>
          )}
        </div>

        {phase !== "after" && (
          <Countdown
            to={(phase === "before" ? season.votingStartsAt : season.votingEndsAt).toISOString()}
            label={phase === "before" ? "До старта голосования" : "До конца голосования"}
          />
        )}

        {live && live.totalVotes > 0 && (
          <p className="text-lg text-paper">
            Голосов отдано:{" "}
            <span className="font-display font-bold tabular-nums">
              <LiveTotal initial={live} />
            </span>
          </p>
        )}

        <ol className="grid w-full max-w-4xl gap-4 text-left md:grid-cols-3">
          {steps.map((step) => {
            const current = step.key === phase;
            return (
              <li
                key={step.key}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "rounded-petal border p-5 backdrop-blur-sm",
                  current ? "border-paper bg-deep/80" : "border-petal/70 bg-deep/50",
                )}
              >
                <p className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-display text-xl font-bold text-paper">{step.date}</span>
                  {current && <span className="rounded-full bg-paper px-2.5 py-0.5 text-sm font-semibold text-deep">идёт сейчас</span>}
                </p>
                <p className="mt-2 flex items-center gap-2 font-semibold text-paper">
                  {"gift" in step && step.gift && <Gift size={18} strokeWidth={1.75} aria-hidden />}
                  {step.title}
                </p>
                <p className="mt-1 text-muted-bright">{step.text}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
