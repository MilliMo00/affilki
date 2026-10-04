import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlesView, parsePage } from "@/components/articles/ArticlesView";
import { getCategories } from "@/lib/data";

type Props = PageProps<"/articles/[category]">;

async function findCategory(slug: string) {
  return (await getCategories()).find((c) => c.slug === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await findCategory((await params).category);
  return category ? { title: category.title, description: `${category.title} на AFFILKI.` } : {};
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const category = await findCategory((await params).category);
  if (!category) notFound();

  return <ArticlesView title={category.title} category={category.slug} page={parsePage((await searchParams).page)} />;
}
