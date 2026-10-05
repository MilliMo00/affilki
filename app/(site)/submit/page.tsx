import type { Metadata } from "next";
import { SubmitGate } from "@/components/submissions/SubmitGate";
import { getCategories, getOpenNominations } from "@/lib/data";

export const metadata: Metadata = {
  title: "Подать заявку",
  description: "Заявка на участие в номинации AFFILKI Awards или материал в ленту: кейс, новость, обзор. Редактор ответит в Telegram.",
};

// Номинации и рубрики читаются из базы — страницу нельзя замораживать при сборке.
export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const [nominations, categories] = await Promise.all([getOpenNominations(), getCategories()]);

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl sm:text-4xl">Подать заявку</h1>
        <p className="mt-4 text-lg text-text">
          На участие в номинации премии или на публикацию материала. Редактор посмотрит заявку и ответит в боте: примет, попросит
          что-то поправить или объяснит отказ.
        </p>
        <div className="mt-8">
          <SubmitGate nominations={nominations} categories={categories} />
        </div>
      </div>
    </div>
  );
}
