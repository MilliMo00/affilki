import Link from "next/link";
import type { Article } from "@/lib/data";
import { MIN_VIEWS_SHOWN, formatCount } from "@/lib/format";

export function PopularList({ articles }: { articles: Article[] }) {
  // Пока просмотров мало, честного «популярного» нет — блок называется по-другому и идёт без цифр.
  const ranked = articles.some((article) => article.views >= MIN_VIEWS_SHOWN);

  return (
    <aside aria-labelledby="popular-title" className="rounded-card border border-petal/40 bg-deep/40 p-5">
      <h2 id="popular-title" className="font-sans text-lg font-semibold">
        {ranked ? "Популярное" : "Стоит прочитать"}
      </h2>
      <ol className="mt-4 space-y-4">
        {articles.map((article, i) => (
          <li key={article.slug} className="flex gap-3">
            <span className="w-6 shrink-0 font-display text-lg font-bold text-petal" aria-hidden>
              {i + 1}
            </span>
            <div>
              <Link href={`/a/${article.slug}`} className="font-medium leading-snug text-paper hover:underline">
                {article.title}
              </Link>
              {article.views >= MIN_VIEWS_SHOWN && <p className="mt-1 text-sm text-muted">{formatCount(article.views)} просмотров</p>}
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
