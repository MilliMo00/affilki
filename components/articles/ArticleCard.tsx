import { Clock, Eye } from "lucide-react";
import Link from "next/link";
import { ArticleCover } from "./ArticleCover";
import { formatCount, formatDate } from "@/lib/format";

export type ArticleCardData = {
  slug: string;
  title: string;
  coverUrl: string | null;
  category: { slug: string; title: string };
  readingMin: number;
  publishedAt: Date;
  views: number;
};

export function ArticleCard({ article }: { article: ArticleCardData }) {
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-card border border-petal/40 bg-deep/40">
      <div className="relative aspect-video overflow-hidden bg-deep">
        <ArticleCover
          slug={article.slug}
          coverUrl={article.coverUrl}
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link
          href={`/articles/${article.category.slug}`}
          className="relative z-10 self-start text-sm font-medium text-muted-bright hover:text-paper"
        >
          {article.category.title}
        </Link>
        <h3 className="line-clamp-2 font-sans text-lg font-semibold leading-snug text-paper">
          <Link href={`/a/${article.slug}`} className="after:absolute after:inset-0 hover:underline">
            {article.title}
          </Link>
        </h3>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={15} strokeWidth={1.75} aria-hidden />
            {article.readingMin} мин
          </span>
          <time dateTime={article.publishedAt.toISOString()}>{formatDate(article.publishedAt)}</time>
          <span className="ml-auto inline-flex items-center gap-1.5">
            <Eye size={15} strokeWidth={1.75} aria-hidden />
            <span className="sr-only">Просмотров:</span>
            {formatCount(article.views)}
          </span>
        </div>
      </div>
    </article>
  );
}
