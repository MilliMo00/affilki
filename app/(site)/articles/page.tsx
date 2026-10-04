import type { Metadata } from "next";
import { ArticlesView, parsePage } from "@/components/articles/ArticlesView";

export const metadata: Metadata = {
  title: "Статьи",
  description: "Кейсы, новости, интервью и обзоры для арбитражного комьюнити.",
};

export default async function ArticlesPage({ searchParams }: PageProps<"/articles">) {
  return <ArticlesView title="Статьи" page={parsePage((await searchParams).page)} />;
}
