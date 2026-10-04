import { Fragment } from "react";
import { AdSlot } from "@/components/ads/AdSlot";
import { cn } from "@/lib/cn";
import type { Article } from "@/lib/data";
import { ArticleCard } from "./ArticleCard";

type ArticleFeedProps = {
  articles: Article[];
  /** 3 колонки — лента на всю ширину, 2 — рядом с сайдбаром. */
  columns?: 2 | 3;
};

/** Сетка карточек; после каждых 4 — нативный слот feed_inline. */
export function ArticleFeed({ articles, columns = 3 }: ArticleFeedProps) {
  return (
    <div className={cn("grid gap-6 sm:grid-cols-2", columns === 3 && "lg:grid-cols-3")}>
      {articles.map((article, i) => (
        <Fragment key={article.slug}>
          <ArticleCard article={article} />
          {(i + 1) % 4 === 0 && <AdSlot slotKey="feed_inline" />}
        </Fragment>
      ))}
    </div>
  );
}
