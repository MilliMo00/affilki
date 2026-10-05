import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { getArticles, getCategories } from "@/lib/data";
import { ArticleFeed } from "./ArticleFeed";
import { CategoryTabs } from "./CategoryTabs";

type ArticlesViewProps = { title: string; category?: string; page: number };

/** Лента статей: общая для /articles и /articles/[category]. */
export async function ArticlesView({ title, category, page }: ArticlesViewProps) {
  const [categories, feed] = await Promise.all([getCategories(), getArticles({ category, page })]);
  const basePath = category ? `/articles/${category}` : "/articles";

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="text-3xl sm:text-4xl">{title}</h1>
      <div className="mt-6">
        <CategoryTabs categories={categories} active={category} />
      </div>

      <div className="mt-8">
        {feed.items.length > 0 ? (
          <>
            <ArticleFeed articles={feed.items} />
            <Pagination page={page} pages={feed.pages} basePath={basePath} />
          </>
        ) : (
          <div className="rounded-card border border-petal/40 px-6 py-14 text-center">
            <p className="text-lg text-text">Статей в рубрике пока нет. Предложи свою.</p>
            <Button href="/submit" className="mt-6">
              Подать заявку
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function parsePage(value: string | string[] | undefined) {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
