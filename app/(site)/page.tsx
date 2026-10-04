import Link from "next/link";
import { AdSlot } from "@/components/ads/AdSlot";
import { ArticleFeed } from "@/components/articles/ArticleFeed";
import { PopularList } from "@/components/articles/PopularList";
import { TgChannelWidget } from "@/components/articles/TgChannelWidget";
import { NominationGrid } from "@/components/awards/NominationGrid";
import { NomineeAvatar } from "@/components/awards/NomineeAvatar";
import { PetalCard } from "@/components/awards/PetalCard";
import { SeasonHero } from "@/components/awards/SeasonHero";
import { StatsRow } from "@/components/awards/StatsRow";
import { Watermark } from "@/components/brand/Watermark";
import { Button } from "@/components/ui/Button";
import { getArticles, getChannelInfo, getCurrentSeason, getPopularArticles, getSeasons, seasonStats } from "@/lib/data";

// Этап, таймер и «дней до финала» зависят от текущего времени — страницу нельзя замораживать при сборке.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [season, seasons, feed, popular, channel] = await Promise.all([
    getCurrentSeason(),
    getSeasons(),
    getArticles({ perPage: 8 }),
    getPopularArticles(5),
    getChannelInfo(),
  ]);

  // Прошлые победители — из сезонов с опубликованными итогами.
  const winners = seasons
    .filter((s) => s.resultsPublished)
    .flatMap((s) =>
      s.nominations.flatMap((nomination) =>
        nomination.nominees.filter((n) => n.result?.place === 1).map((nominee) => ({ season: s, nomination, nominee })),
      ),
    );

  return (
    <>
      {season ? (
        <>
          <SeasonHero season={season} ctaHref="/awards" />
          <StatsRow stats={seasonStats(season)} />
        </>
      ) : (
        <section className="grain relative overflow-hidden bg-hero">
          <Watermark />
          <div className="container-page relative flex min-h-[60dvh] flex-col items-center justify-center gap-6 py-20 text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl">Премия скоро</h1>
            <p className="max-w-xl text-lg text-paper">
              AFFILKI Awards — народная премия арбитражного рынка. Подпишись на канал, чтобы не пропустить старт.
            </p>
            <Button href={channel.url} size="lg">
              Подписаться на канал
            </Button>
          </div>
        </section>
      )}

      <div className="container-page py-8">
        <AdSlot slotKey="home_top" />
      </div>

      {season && (
        <section aria-labelledby="home-nominations" className="bg-indigo">
          <div className="container-page py-12">
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="home-nominations" className="text-2xl">
                Номинации сезона
              </h2>
              <Link href="/awards" className="font-medium text-paper underline decoration-muted-bright underline-offset-4 hover:decoration-paper">
                Вся премия
              </Link>
            </div>
            <NominationGrid season={season} />
          </div>
        </section>
      )}

      <section aria-labelledby="home-articles" className="container-page py-12">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="home-articles" className="text-2xl">
            Свежие статьи
          </h2>
          <Link href="/articles" className="font-medium text-paper underline decoration-glow underline-offset-4 hover:decoration-paper">
            Все статьи
          </Link>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <ArticleFeed articles={feed.items} columns={2} />
          <div className="space-y-6">
            <TgChannelWidget channel={channel} />
            <PopularList articles={popular} />
            <AdSlot slotKey="sidebar" />
          </div>
        </div>
      </section>

      {winners.length > 0 && (
        <section aria-labelledby="home-winners" className="bg-indigo">
          <div className="container-page py-12">
            <h2 id="home-winners" className="mb-8 text-2xl">
              Прошлые победители
            </h2>
            <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {winners.map(({ season: s, nomination, nominee }) => (
                <li key={nominee.slug}>
                  <PetalCard tone="winner" className="flex h-full items-center gap-4">
                    <NomineeAvatar name={nominee.name} logoUrl={nominee.logoUrl} />
                    <div className="min-w-0">
                      <h3 className="text-xl">
                        <Link href={`/n/${nominee.slug}`} className="after:absolute after:inset-0 after:rounded-petal hover:underline">
                          {nominee.name}
                        </Link>
                      </h3>
                      <p className="mt-1 text-muted-bright">
                        {nomination.title} · {s.year}
                      </p>
                    </div>
                  </PetalCard>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
