// Слой данных публичной части: страницы и компоненты ходят в базу только через него.
import type { Prisma } from "@prisma/client";
import { cache } from "react";
import { db } from "@/lib/db";
import { TG_CHANNEL_URL } from "@/lib/env";
import { telegram } from "@/lib/telegram/client";
import type { Article, Category, ChannelInfo, Nomination, Nominee, NomineeLinks, Season } from "./types";

export type * from "./types";

export const ARTICLES_PER_PAGE = 12;

// ── Статьи ─────────────────────────────────────────────────────────────────

const articleInclude = { category: true } satisfies Prisma.ArticleInclude;
type ArticleRow = Prisma.ArticleGetPayload<{ include: typeof articleInclude }>;

// Опубликовано и дата публикации уже наступила (отложенные статьи не показываем).
const publishedNow = () => ({ status: "PUBLISHED" as const, publishedAt: { not: null, lte: new Date() } });

function toArticle(row: ArticleRow): Article {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    contentHtml: row.contentHtml,
    coverUrl: row.coverUrl,
    coverText: row.coverText,
    category: { slug: row.category.slug, title: row.category.title },
    authorName: row.authorName,
    readingMin: row.readingMin,
    views: row.views,
    publishedAt: row.publishedAt ?? row.createdAt,
  };
}

export const getCategories = cache(async (): Promise<Category[]> => {
  return db.category.findMany({ orderBy: { order: "asc" }, select: { slug: true, title: true } });
});

export async function getArticles(opts: { category?: string; page?: number; perPage?: number } = {}) {
  const { category, page = 1, perPage = ARTICLES_PER_PAGE } = opts;
  const where = { ...publishedNow(), ...(category ? { category: { slug: category } } : {}) };
  const [rows, total] = await Promise.all([
    db.article.findMany({
      where,
      include: articleInclude,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.article.count({ where }),
  ]);
  return { items: rows.map(toArticle), total, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export const getArticle = cache(async (slug: string): Promise<Article | null> => {
  const row = await db.article.findFirst({ where: { slug, ...publishedNow() }, include: articleInclude });
  return row ? toArticle(row) : null;
});

export async function getPopularArticles(limit = 5): Promise<Article[]> {
  const rows = await db.article.findMany({
    where: publishedNow(),
    include: articleInclude,
    orderBy: { views: "desc" },
    take: limit,
  });
  return rows.map(toArticle);
}

export async function getRelatedArticles(article: Article, limit = 3): Promise<Article[]> {
  const rows = await db.article.findMany({
    where: { ...publishedNow(), category: { slug: article.category.slug }, slug: { not: article.slug } },
    include: articleInclude,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return rows.map(toArticle);
}

// ── Премия ─────────────────────────────────────────────────────────────────

const seasonInclude = {
  nominations: {
    orderBy: { order: "asc" },
    include: { nominees: { where: { published: true }, orderBy: { name: "asc" } } },
  },
} satisfies Prisma.SeasonInclude;
type SeasonRow = Prisma.SeasonGetPayload<{ include: typeof seasonInclude }>;
type NominationRow = SeasonRow["nominations"][number];

const stringList = (value: Prisma.JsonValue | null): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

function toNominee(row: NominationRow["nominees"][number]): Nominee {
  return {
    slug: row.slug,
    name: row.name,
    logoUrl: row.logoUrl,
    tagline: row.tagline ?? "",
    description: row.description,
    links: (row.links ?? {}) as NomineeLinks,
    sources: stringList(row.sources),
    rightOfReply: row.rightOfReply,
  };
}

/** Слово для обложки из названия номинации: без «Лучший/Самое/Главный», последнее слово. */
export function nominationPosterText(title: string) {
  const words = title
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter((word) => word && !/^(лучш|сам|главн)/i.test(word));
  const tail = words.filter((word) => !/^(года|по)$/i.test(word));
  return tail[tail.length - 1] ?? title;
}

function toNomination(row: NominationRow): Nomination {
  return {
    slug: row.slug,
    number: row.order,
    title: row.title,
    shortDesc: row.shortDesc,
    description: row.description,
    criteria: stringList(row.criteria),
    eligibility: row.eligibility,
    icon: row.icon,
    coverText: row.coverText?.trim() || nominationPosterText(row.title),
    group: row.group,
    jury: row.jury,
    isEvents: row.requiresLegalReview,
    testVoting: row.testVoting,
    // Там, где нужна юридическая проверка, непроверенные участники наружу не попадают вообще.
    nominees: row.nominees.filter((n) => !row.requiresLegalReview || n.legalChecked).map(toNominee),
  };
}

function toSeason(row: SeasonRow): Season {
  return {
    year: row.year,
    title: row.title,
    stage: row.stage,
    votingStartsAt: row.votingStartsAt,
    votingEndsAt: row.votingEndsAt,
    nextStageAt: row.nextStageAt,
    resultsPublished: row.resultsPublished,
    communityWeight: row.communityWeight,
    juryWeight: row.juryWeight,
    nominations: row.nominations.map(toNomination),
  };
}

/** Текущий сезон — с самым поздним годом. */
export const getCurrentSeason = cache(async (): Promise<Season | null> => {
  const row = await db.season.findFirst({ orderBy: { year: "desc" }, include: seasonInclude });
  return row ? toSeason(row) : null;
});

/** Номинация текущего сезона и её соседи по порядку. */
export async function getNomination(slug: string) {
  const season = await getCurrentSeason();
  const index = season?.nominations.findIndex((n) => n.slug === slug) ?? -1;
  if (!season || index === -1) return null;
  return {
    season,
    nomination: season.nominations[index],
    prev: season.nominations[index - 1] ?? null,
    next: season.nominations[index + 1] ?? null,
  };
}

export async function getNominee(
  slug: string,
): Promise<{ season: Season; nomination: Nomination; nominee: Nominee } | null> {
  const season = await getCurrentSeason();
  for (const nomination of season?.nominations ?? []) {
    const nominee = nomination.nominees.find((n) => n.slug === slug);
    if (season && nominee) return { season, nomination, nominee };
  }
  return null;
}

/** Номинации текущего сезона, куда сейчас принимаются заявки. */
export async function getOpenNominations() {
  const season = await db.season.findFirst({ orderBy: { year: "desc" } });
  if (!season) return [];
  return db.nomination.findMany({
    where: { seasonId: season.id, acceptingEntries: true },
    orderBy: { order: "asc" },
    select: { id: true, title: true },
  });
}

export async function seasonStats(season: Season, now = new Date()) {
  const msLeft = season.votingEndsAt.getTime() - now.getTime();
  return {
    /** Дней до старта голосования; 0 — уже идёт или закончилось. */
    daysToStart: Math.max(0, Math.ceil((season.votingStartsAt.getTime() - now.getTime()) / 86_400_000)),
    // Только общее число: аннулированные голоса и голоса забаненных не считаются.
    votes: await db.vote.count({
      where: {
        voidedAt: null,
        nomination: { season: { year: season.year } },
        tgUserId: { notIn: (await db.tgBan.findMany({ select: { tgUserId: true } })).map((b) => b.tgUserId) },
      },
    }),
    nominees: season.nominations.reduce((sum, n) => sum + n.nominees.length, 0),
    nominations: season.nominations.length,
    daysLeft: Math.max(0, Math.ceil(msLeft / 86_400_000)),
  };
}

/** Открыто ли голосование: по датам сезона или досрочно — в номинации с тестовым голосованием. */
export function isVotingOpen(season: Season, nomination?: Pick<Nomination, "testVoting">, now = new Date()) {
  if (now > season.votingEndsAt) return false;
  return now >= season.votingStartsAt || !!nomination?.testVoting;
}

let memberCount: { value: number | null; at: number } | null = null;

export async function getChannelInfo(): Promise<ChannelInfo> {
  // Число подписчиков спрашиваем у Telegram не чаще раза в час.
  if (!memberCount || Date.now() - memberCount.at > 3_600_000) {
    memberCount = { value: await telegram.channelMemberCount(), at: Date.now() };
  }
  return {
    title: "AFFILKI",
    handle: `@${TG_CHANNEL_URL.split("/").pop()}`,
    url: TG_CHANNEL_URL,
    subscribers: memberCount.value,
  };
}
