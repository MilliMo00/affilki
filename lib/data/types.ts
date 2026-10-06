import type { Stage } from "@/lib/stages";

export type Category = { slug: string; title: string };

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  coverUrl: string | null;
  /** Короткий текст для обложки-плаката, если картинки нет. */
  coverText: string | null;
  category: Category;
  authorName: string;
  readingMin: number;
  views: number;
  publishedAt: Date;
};

export type NomineeLinks = { site?: string; tg?: string };

export type Nominee = {
  slug: string;
  name: string;
  logoUrl: string | null;
  tagline: string;
  description: string | null;
  links: NomineeLinks;
  /** Публичные источники — для номинации-событий. */
  sources: string[];
  /** Комментарий упомянутой стороны. */
  rightOfReply: string | null;
};

export type NomGroup = "TEAMS" | "MEDIA" | "MARKET";

export type Nomination = {
  slug: string;
  /** Порядковый номер 1–9. */
  number: number;
  title: string;
  shortDesc: string;
  description: string;
  criteria: string[];
  eligibility: string;
  icon: string;
  group: NomGroup;
  jury: string | null;
  /** Номинация-события («Скандал года»): нейтральные формулировки, источники, право на ответ. */
  isEvents: boolean;
  /** Тестовое голосование открыто досрочно, до общего старта сезона. */
  testVoting: boolean;
  nominees: Nominee[];
};

export type Season = {
  year: number;
  title: string;
  stage: Stage;
  votingStartsAt: Date;
  votingEndsAt: Date;
  nextStageAt: Date | null;
  resultsPublished: boolean;
  communityWeight: number;
  juryWeight: number;
  nominations: Nomination[];
};

export type ChannelInfo = { title: string; handle: string; url: string; subscribers: number | null };
