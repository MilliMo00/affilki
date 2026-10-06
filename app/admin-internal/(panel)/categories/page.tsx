import Link from "next/link";
import { ActionForm } from "@/components/admin/ActionForm";
import { adminInput } from "@/components/admin/styles";
import { Card, Label, PageTitle } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { adminUrl } from "@/lib/admin/path";
import { db } from "@/lib/db";
import { deleteCategory, saveCategory } from "../articles/actions";

export default async function CategoriesPage() {
  await requirePermission("content");
  const categories = await db.category.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { articles: true } } } });

  return (
    <>
      <PageTitle title="Рубрики" lead="Вкладки в ленте статей и выбор в форме заявки.">
        <Link href={adminUrl("/articles")} className="font-medium text-paper underline underline-offset-4">
          К статьям
        </Link>
      </PageTitle>

      <div className="grid max-w-4xl gap-6">
        {categories.map((category) => (
          <Card key={category.id} title={`${category.title} · статей: ${category._count.articles}`}>
            <ActionForm action={saveCategory.bind(null, category.id)} submit="Сохранить">
              <div className="grid gap-4 sm:grid-cols-3">
                <Label title="Название">
                  <input name="title" defaultValue={category.title} required className={adminInput} />
                </Label>
                <Label title="Адрес" hint="/articles/адрес">
                  <input name="slug" defaultValue={category.slug} className={adminInput} />
                </Label>
                <Label title="Порядок">
                  <input type="number" name="order" defaultValue={category.order} min={0} className={adminInput} />
                </Label>
              </div>
            </ActionForm>
            {category._count.articles === 0 && (
              <ActionForm action={deleteCategory.bind(null, category.id)} submit="Удалить рубрику" danger totp className="mt-6 border-t border-petal/30 pt-4">
                <span />
              </ActionForm>
            )}
          </Card>
        ))}

        <Card title="Новая рубрика">
          <ActionForm action={saveCategory.bind(null, "new")} submit="Добавить">
            <div className="grid gap-4 sm:grid-cols-3">
              <Label title="Название">
                <input name="title" required className={adminInput} />
              </Label>
              <Label title="Адрес" hint="Пусто — соберём из названия">
                <input name="slug" className={adminInput} />
              </Label>
              <Label title="Порядок">
                <input type="number" name="order" defaultValue={categories.length} min={0} className={adminInput} />
              </Label>
            </div>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
