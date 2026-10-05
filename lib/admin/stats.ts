import { db } from "@/lib/db";

// Запросы для дашбордов. Только агрегаты: ни Telegram ID, ни хэшей наружу не отдаётся.
// Все параметры идут в запрос как привязанные значения (никакой склейки строк).

export type Row = { label: string; value: number; extra?: number };

export async function overview(from: Date, to: Date) {
  const [traffic] = await db.$queryRaw<{ views: number; visitors: number; ad_clicks: number; vote_clicks: number }[]>`
    select count(*) filter (where type = 'page_view')::int as views,
           count(distinct coalesce("visitorId", "sessionId", "ipHash", id::text)) filter (where type = 'page_view')::int as visitors,
           count(*) filter (where type = 'ad_click')::int as ad_clicks,
           count(*) filter (where type = 'vote_click')::int as vote_clicks
    from "AnalyticsEvent" where ts >= ${from} and ts < ${to}`;
  const votes = await db.vote.count({ where: { createdAt: { gte: from, lt: to }, voidedAt: null } });
  return {
    visitors: traffic.visitors,
    views: traffic.views,
    votes,
    adClicks: traffic.ad_clicks,
    voteClicks: traffic.vote_clicks,
    // Сколько нажатий «Голосовать» дошло до голоса.
    conversion: traffic.vote_clicks > 0 ? votes / traffic.vote_clicks : null,
  };
}

export async function topPages(from: Date, to: Date): Promise<Row[]> {
  return db.$queryRaw<Row[]>`
    select split_part(path, '?', 1) as label, count(*)::int as value,
           count(distinct coalesce("visitorId", "sessionId", "ipHash", id::text))::int as extra
    from "AnalyticsEvent" where type = 'page_view' and ts >= ${from} and ts < ${to} and path is not null
    group by 1 order by 2 desc limit 20`;
}

async function breakdown(column: "source" | "device" | "country", from: Date, to: Date): Promise<Row[]> {
  // Имя столбца выбирается из фиксированного набора в коде, а не приходит от пользователя.
  if (column === "source") {
    return db.$queryRaw<Row[]>`
      select coalesce(nullif("utmSource", ''), referrer, 'прямые заходы') as label,
             count(distinct coalesce("visitorId", "sessionId", "ipHash", id::text))::int as value
      from "AnalyticsEvent" where type = 'page_view' and ts >= ${from} and ts < ${to} group by 1 order by 2 desc limit 15`;
  }
  if (column === "device") {
    return db.$queryRaw<Row[]>`
      select coalesce(device, 'неизвестно') as label, count(distinct coalesce("visitorId", "sessionId", "ipHash", id::text))::int as value
      from "AnalyticsEvent" where type = 'page_view' and ts >= ${from} and ts < ${to} group by 1 order by 2 desc`;
  }
  return db.$queryRaw<Row[]>`
    select coalesce(country, 'неизвестно') as label, count(distinct coalesce("visitorId", "sessionId", "ipHash", id::text))::int as value
    from "AnalyticsEvent" where type = 'page_view' and ts >= ${from} and ts < ${to} group by 1 order by 2 desc limit 15`;
}

export const sources = (from: Date, to: Date) => breakdown("source", from, to);
export const devices = (from: Date, to: Date) => breakdown("device", from, to);
export const countries = (from: Date, to: Date) => breakdown("country", from, to);

const FUNNEL = [
  ["vote_click", "Нажали «Голосовать»"],
  ["login_start", "Начали вход через бота"],
  ["bot_start", "Нажали «Старт» в боте"],
  ["login_confirmed", "Подтвердили вход"],
  ["captcha_passed", "Прошли капчу"],
  ["vote_cast", "Голос записан"],
] as const;

const REASONS: Record<string, string> = {
  not_subscribed: "не подписан на канал",
  too_new: "слишком свежий аккаунт",
  no_username: "нет username",
  no_avatar: "нет фото профиля",
  banned: "аккаунт забанен",
  already_voted: "уже голосовал в номинации",
  not_started: "голосование не началось",
  ended: "голосование закончилось",
  not_found: "участник не найден",
};

/** Воронка голосования. Вход нужен один раз, поэтому шагов входа закономерно меньше, чем голосов. */
export async function voteFunnel(from: Date, to: Date) {
  const [counts, rejected, captchaFailed] = await Promise.all([
    db.analyticsEvent.groupBy({ by: ["type"], where: { ts: { gte: from, lt: to }, type: { in: FUNNEL.map(([type]) => type) } }, _count: { _all: true } }),
    db.$queryRaw<Row[]>`
      select coalesce(meta->>'reason', 'другое') as label, count(*)::int as value
      from "AnalyticsEvent" where type = 'vote_rejected' and ts >= ${from} and ts < ${to} group by 1 order by 2 desc`,
    db.analyticsEvent.count({ where: { type: "captcha_failed", ts: { gte: from, lt: to } } }),
  ]);
  const byType = new Map(counts.map((c) => [c.type, c._count._all]));
  return {
    steps: FUNNEL.map(([type, label]) => ({ label, value: byType.get(type) ?? 0 })),
    reasons: [
      ...rejected.map((row) => ({ label: REASONS[row.label] ?? row.label, value: row.value })),
      ...(captchaFailed > 0 ? [{ label: "не прошёл капчу", value: captchaFailed }] : []),
    ],
  };
}

export async function votesByDay(from: Date, to: Date): Promise<Row[]> {
  const rows = await db.$queryRaw<{ d: Date; n: number }[]>`
    select date_trunc('day', "createdAt")::date as d, count(*)::int as n
    from "Vote" where "createdAt" >= ${from} and "createdAt" < ${to} and "voidedAt" is null group by 1 order by 1`;
  return rows.map((row) => ({ label: row.d.toISOString().slice(5, 10).split("-").reverse().join("."), value: row.n }));
}

/** Откуда приходят на страницы участников: видно, кто и где разгоняет свою ссылку. */
export async function nomineeSources(from: Date, to: Date) {
  return db.$queryRaw<{ nominee: string; source: string; visitors: number }[]>`
    select "entityId" as nominee, coalesce(nullif("utmSource", ''), referrer, 'прямые заходы') as source,
           count(distinct coalesce("visitorId", "sessionId", "ipHash", id::text))::int as visitors
    from "AnalyticsEvent"
    where type = 'page_view' and "entityType" = 'nominee' and ts >= ${from} and ts < ${to}
    group by 1, 2 order by 3 desc limit 40`;
}

export async function topArticles(from: Date, to: Date) {
  return db.$queryRaw<{ slug: string; views: number; readers: number; depth: number | null }[]>`
    with views as (
      select "entityId" as slug, count(*)::int as views,
             count(distinct coalesce("visitorId", "sessionId", "ipHash", id::text))::int as readers
      from "AnalyticsEvent" where type = 'page_view' and "entityType" = 'article' and ts >= ${from} and ts < ${to} group by 1
    ), depth as (
      select slug, avg(max_depth)::float as depth from (
        select "entityId" as slug, coalesce("sessionId", "ipHash") as reader, max((meta->>'depth')::int) as max_depth
        from "AnalyticsEvent" where type = 'article_read' and "entityType" = 'article' and ts >= ${from} and ts < ${to} group by 1, 2
      ) per_reader group by 1
    )
    select views.slug, views.views, views.readers, depth.depth from views left join depth using (slug) order by views.views desc limit 20`;
}
