import type { Stage } from "@/lib/stages";

export type Category = { slug: string; title: string };

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  coverUrl: string | null;
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
  links: NomineeLinks;
  /** Заполнено, только когда итоги сезона опубликованы. До этого счётчики наружу не отдаются. */
  result?: { place: number; percent: number };
};

export type Nomination = {
  slug: string;
  title: string;
  description: string;
  criteria: string;
  nominees: Nominee[];
};

export type Season = {
  year: number;
  title: string;
  stage: Stage;
  votingStartsAt: Date;
  votingEndsAt: Date;
  /** Дата начала следующего этапа — для индикатора. */
  nextStageAt?: Date;
  resultsPublished: boolean;
  totalVotes: number;
  nominations: Nomination[];
};

export type ChannelInfo = { title: string; handle: string; url: string; subscribers: number };
