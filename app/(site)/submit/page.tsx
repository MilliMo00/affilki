import type { Metadata } from "next";
import { SubmitForm } from "@/components/articles/SubmitForm";
import { getCategories } from "@/lib/data";

export const metadata: Metadata = {
  title: "Предложить статью",
  description: "Есть кейс, разбор или новость для арбитражного комьюнити? Отправь заявку — редакция ответит в Telegram.",
};

// Рубрики читаются из базы — страницу нельзя замораживать при сборке.
export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const categories = await getCategories();

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl sm:text-4xl">Предложить статью</h1>
        <p className="mt-4 text-lg text-text">
          Кейс, разбор связки, обзор сервиса или новость. Регистрация не нужна: оставь контакт, редактор напишет в
          Telegram.
        </p>
        <div className="mt-8">
          <SubmitForm categories={categories} />
        </div>
      </div>
    </div>
  );
}
