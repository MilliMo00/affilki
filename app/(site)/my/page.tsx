import type { Metadata } from "next";
import { MySubmissions } from "@/components/submissions/MySubmissions";
import { Button } from "@/components/ui/Button";
import { getCategories, getOpenNominations } from "@/lib/data";

export const metadata: Metadata = { title: "Мои заявки", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MyPage() {
  const [nominations, categories] = await Promise.all([getOpenNominations(), getCategories()]);

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-3xl sm:text-4xl">Мои заявки</h1>
          <Button href="/submit" variant="secondary">
            Новая заявка
          </Button>
        </div>
        <div className="mt-8">
          <MySubmissions nominations={nominations} categories={categories} />
        </div>
      </div>
    </div>
  );
}
