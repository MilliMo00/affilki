import Link from "next/link";
import { AdSlot } from "@/components/ads/AdSlot";
import { ArticleFeed } from "@/components/articles/ArticleFeed";
import { PopularList } from "@/components/articles/PopularList";
import { TgChannelWidget } from "@/components/articles/TgChannelWidget";
import { NominationHub } from "@/components/awards/NominationHub";
import { SeasonHero } from "@/components/awards/SeasonHero";
import { SponsorCall } from "@/components/awards/SponsorCall";
import { StatsRow } from "@/components/awards/StatsRow";
import { Watermark } from "@/components/brand/Watermark";
import { Button } from "@/components/ui/Button";
import { LiveTickerSlot } from "@/components/live/LiveTickerSlot";
import { toHubNomination } from "@/lib/awards";
import { getLiveSnapshot } from "@/lib/live/snapshot";
import { getArticles, getChannelInfo, getCurrentSeason, getOpenNominations, getPopularArticles, seasonStats } from "@/lib/data";

// Этап, таймер и «дней до финала» зависят от текущего времени — страницу нельзя замораживать при сборке.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [season, open, live, feed, popular, channel] = await Promise.all([
    getCurrentSeason(),
    getOpenNominations(),
    getLiveSnapshot(),
    getArticles({ perPage: 8 }),
    getPopularArticles(5),
    getChannelInfo(),
  ]);

  return (
    <>
      <LiveTickerSlot />
      {season ? (
        <>
          <SeasonHero season={season} live={live} acceptingEntries={open.length > 0} nominationsHref="/awards" />
          <StatsRow stats={await seasonStats(season)} />
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
            <NominationHub nominations={season.nominations.map(toHubNomination)} filters={false} live={live} />
          </div>
        </section>
      )}

      {season && <SponsorCall />}

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

    </>
  );
}
