// Слой данных публичной части. Сейчас отдаёт демо-данные; при подключении Prisma
// меняются только тела функций — страницы и компоненты не трогаем.
import { DEFAULT_CATEGORIES } from "@/lib/nav";
import { TG_CHANNEL_URL } from "@/lib/env";
import { ARTICLES } from "./mock-articles";
import { SEASONS } from "./mock-awards";
import type { Article, Category, ChannelInfo, Nomination, Nominee, Season } from "./types";

export type * from "./types";

export const ARTICLES_PER_PAGE = 12;

export async function getCategories(): Promise<Category[]> {
  return [...DEFAULT_CATEGORIES];
}

export async function getArticles(opts: { category?: string; page?: number; perPage?: number } = {}) {
  const { category, page = 1, perPage = ARTICLES_PER_PAGE } = opts;
  const all = category ? ARTICLES.filter((a) => a.category.slug === category) : ARTICLES;
  return {
    items: all.slice((page - 1) * perPage, page * perPage),
    total: all.length,
    pages: Math.max(1, Math.ceil(all.length / perPage)),
  };
}

export async function getArticle(slug: string): Promise<Article | null> {
  return ARTICLES.find((a) => a.slug === slug) ?? null;
}

export async function getPopularArticles(limit = 5): Promise<Article[]> {
  return [...ARTICLES].sort((a, b) => b.views - a.views).slice(0, limit);
}

export async function getRelatedArticles(article: Article, limit = 3): Promise<Article[]> {
  return ARTICLES.filter((a) => a.category.slug === article.category.slug && a.slug !== article.slug).slice(0, limit);
}

export async function getSeasons(): Promise<Season[]> {
  return SEASONS;
}

export async function getCurrentSeason(): Promise<Season | null> {
  return SEASONS[0] ?? null;
}

export async function getSeason(year: number): Promise<Season | null> {
  return SEASONS.find((s) => s.year === year) ?? null;
}

export async function getNomination(
  year: number,
  slug: string,
): Promise<{ season: Season; nomination: Nomination } | null> {
  const season = await getSeason(year);
  const nomination = season?.nominations.find((n) => n.slug === slug);
  return season && nomination ? { season, nomination } : null;
}

export async function getNominee(
  slug: string,
): Promise<{ season: Season; nomination: Nomination; nominee: Nominee } | null> {
  for (const season of SEASONS) {
    for (const nomination of season.nominations) {
      const nominee = nomination.nominees.find((n) => n.slug === slug);
      if (nominee) return { season, nomination, nominee };
    }
  }
  return null;
}

export function seasonStats(season: Season, now = new Date()) {
  const msLeft = season.votingEndsAt.getTime() - now.getTime();
  return {
    votes: season.totalVotes,
    nominees: season.nominations.reduce((sum, n) => sum + n.nominees.length, 0),
    nominations: season.nominations.length,
    daysLeft: Math.max(0, Math.ceil(msLeft / 86_400_000)),
  };
}

export function nominationId(season: Season, nomination: Nomination) {
  return `${season.year}/${nomination.slug}`;
}

export function isVotingOpen(season: Season, now = new Date()) {
  return now >= season.votingStartsAt && now <= season.votingEndsAt;
}

export async function getChannelInfo(): Promise<ChannelInfo> {
  return {
    title: "AFFILKI",
    handle: `@${TG_CHANNEL_URL.split("/").pop()}`,
    url: TG_CHANNEL_URL,
    subscribers: 8400,
  };
}
