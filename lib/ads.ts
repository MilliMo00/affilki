import { cache } from "react";
import { db } from "@/lib/db";

/** Действующие кампании по слотам: слот продан, пока сейчас внутри дат кампании. */
export const getActiveCampaigns = cache(async () => {
  const now = new Date();
  const campaigns = await db.adCampaign.findMany({ where: { startsAt: { lte: now }, endsAt: { gte: now } }, orderBy: { startsAt: "desc" } });
  // Если на слот случайно заведено две кампании на одни даты — показывается та, что началась позже.
  const bySlot = new Map<string, (typeof campaigns)[number]>();
  for (const campaign of campaigns) if (!bySlot.has(campaign.slotKey)) bySlot.set(campaign.slotKey, campaign);
  return bySlot;
});

export type AdDayRow = { day: Date; impressions: number; uniqueImpressions: number; clicks: number; uniqueClicks: number };

type RawRow = { d: Date; type: string; n: number; u: number };

function foldDays(rows: RawRow[]): AdDayRow[] {
  const days = new Map<number, AdDayRow>();
  for (const row of rows) {
    const key = row.d.getTime();
    const day = days.get(key) ?? { day: row.d, impressions: 0, uniqueImpressions: 0, clicks: 0, uniqueClicks: 0 };
    if (row.type === "ad_impression") Object.assign(day, { impressions: row.n, uniqueImpressions: row.u });
    else Object.assign(day, { clicks: row.n, uniqueClicks: row.u });
    days.set(key, day);
  }
  return [...days.values()].sort((a, b) => a.day.getTime() - b.day.getTime());
}

/** Показы и клики кампании по дням. */
export async function campaignStats(campaignId: string) {
  const rows = await db.$queryRaw<RawRow[]>`
    select date_trunc('day', ts)::date as d, type, count(*)::int as n,
           count(distinct coalesce("visitorId", "sessionId", "ipHash"))::int as u
    from "AnalyticsEvent"
    where type in ('ad_impression', 'ad_click') and meta->>'campaign' = ${campaignId}
    group by 1, 2`;
  return foldDays(rows);
}

/** Показы и клики слота за период: отдельно проданные размещения и заглушка «Слот свободен». */
export async function slotStats(slotKey: string, from: Date) {
  const rows = await db.$queryRaw<{ type: string; sold: boolean; n: number; u: number }[]>`
    select type, coalesce(meta->>'sold', 'false') = 'true' as sold, count(*)::int as n,
           count(distinct coalesce("visitorId", "sessionId", "ipHash"))::int as u
    from "AnalyticsEvent"
    where type in ('ad_impression', 'ad_click') and meta->>'slot' = ${slotKey} and ts >= ${from}
    group by 1, 2`;
  const pick = (type: string, sold: boolean) => rows.find((row) => row.type === type && row.sold === sold) ?? { n: 0, u: 0 };
  return {
    sold: { impressions: pick("ad_impression", true).n, clicks: pick("ad_click", true).n, uniqueClicks: pick("ad_click", true).u },
    // Клики по заглушке — это люди, которым интересно купить рекламу.
    placeholder: { impressions: pick("ad_impression", false).n, clicks: pick("ad_click", false).n, uniqueClicks: pick("ad_click", false).u },
  };
}

export const ctr = (clicks: number, impressions: number) => (impressions > 0 ? `${((clicks / impressions) * 100).toFixed(2)}%` : "—");
