import { Clock, Eye } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ads/AdSlot";
import { ArticleBody } from "@/components/articles/ArticleBody";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { ArticleCover } from "@/components/articles/ArticleCover";
import { TgChannelWidget } from "@/components/articles/TgChannelWidget";
import { ShareButton } from "@/components/ui/ShareButton";
import { getArticle, getChannelInfo, getRelatedArticles } from "@/lib/data";
import { SITE_URL } from "@/lib/env";
import { formatCount, formatDate } from "@/lib/format";

type Props = PageProps<"/a/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticle((await params).slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: { type: "article", publishedTime: article.publishedAt.toISOString(), authors: [article.authorName] },
  };
}

export default async function ArticlePage({ params }: Props) {
  const article = await getArticle((await params).slug);
  if (!article) notFound();

  const [related, channel] = await Promise.all([getRelatedArticles(article), getChannelInfo()]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt.toISOString(),
    author: { "@type": "Organization", name: article.authorName },
    publisher: { "@type": "Organization", name: "AFFILKI" },
    mainEntityOfPage: `${SITE_URL}/a/${article.slug}`,
  };

  return (
    <div className="container-page py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article data-article>
          <header className="max-w-prose">
            <Link href={`/articles/${article.category.slug}`} className="font-medium text-muted-bright hover:text-paper">
              {article.category.title}
            </Link>
            <h1 className="mt-3 text-2xl sm:text-3xl">{article.title}</h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
              <span className="font-medium text-text">{article.authorName}</span>
              <time dateTime={article.publishedAt.toISOString()}>{formatDate(article.publishedAt)}</time>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={15} strokeWidth={1.75} aria-hidden />
                {article.readingMin} мин
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye size={15} strokeWidth={1.75} aria-hidden />
                <span className="sr-only">Просмотров:</span>
                {formatCount(article.views)}
              </span>
            </div>
          </header>

          <div className="relative my-8 aspect-video overflow-hidden rounded-card">
            <ArticleCover
              slug={article.slug}
              coverUrl={article.coverUrl}
              sizes="(min-width: 1024px) 860px, 100vw"
              priority
            />
          </div>

          <ArticleBody html={article.contentHtml} />

          <div className="mt-10 border-t border-petal/30 pt-6">
            <ShareButton path={`/a/${article.slug}`} title={article.title} />
          </div>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            <TgChannelWidget channel={channel} />
            <AdSlot slotKey="sidebar" />
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-16">
          <h2 id="related-title" className="mb-6 text-2xl">
            Читайте также
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ArticleCard key={item.slug} article={item} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 lg:hidden">
        <TgChannelWidget channel={channel} />
      </div>
    </div>
  );
}
