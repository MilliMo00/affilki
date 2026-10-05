import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, adminInput } from "@/components/admin/ActionForm";
import { Card, Label, PageTitle } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { adminUrl } from "@/lib/admin/path";
import { db } from "@/lib/db";
import { deleteArticle, saveArticle } from "../actions";

export default async function ArticleEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("content");
  const { id } = await params;
  const isNew = id === "new";
  const [article, categories] = await Promise.all([isNew ? null : db.article.findUnique({ where: { id } }), db.category.findMany({ orderBy: { order: "asc" } })]);
  if (!isNew && !article) notFound();
  const legacy = article && !article.contentSource;

  return (
    <>
      <PageTitle title={isNew ? "Новая статья" : article!.title}>
        <div className="flex flex-wrap gap-4">
          {article?.status === "PUBLISHED" && (
            <Link href={`/a/${article.slug}`} target="_blank" className="font-medium text-paper underline underline-offset-4">
              Открыть на сайте
            </Link>
          )}
          <Link href={adminUrl("/articles")} className="font-medium text-paper underline underline-offset-4">
            Ко всем статьям
          </Link>
        </div>
      </PageTitle>

      <Card className="max-w-4xl">
        <ActionForm action={saveArticle.bind(null, id)} submit={isNew ? "Создать" : "Сохранить"}>
          <Label title="Заголовок">
            <input name="title" defaultValue={article?.title} required className={adminInput} />
          </Label>
          <div className="grid gap-4 sm:grid-cols-3">
            <Label title="Рубрика">
              <select name="categoryId" defaultValue={article?.categoryId ?? categories[0]?.id} className={adminInput}>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </Label>
            <Label title="Статус">
              <select name="status" defaultValue={article?.status ?? "DRAFT"} className={adminInput}>
                <option value="DRAFT">Черновик</option>
                <option value="PUBLISHED">Опубликована</option>
                <option value="ARCHIVED">В архиве</option>
              </select>
            </Label>
            <Label title="Автор">
              <input name="authorName" defaultValue={article?.authorName ?? "AFFILKI"} required className={adminInput} />
            </Label>
          </div>
          <Label title="Адрес страницы" hint="Пусто — соберём из заголовка. Статья откроется по адресу /a/адрес">
            <input name="slug" defaultValue={article?.slug} className={adminInput} />
          </Label>
          <Label
            title="Текст"
            hint="Абзацы — через пустую строку. ## Заголовок, ### Подзаголовок, - пункт, 1. пункт, > цитата, **жирный**, *курсив*, [текст](https://ссылка), ![подпись](адрес картинки)"
          >
            <textarea name="source" defaultValue={article?.contentSource ?? ""} rows={22} className={`${adminInput} font-mono text-sm`} />
          </Label>
          {legacy && (
            <p className="rounded-card border border-petal/60 p-3 text-text">
              У этой статьи нет исходника в разметке — текст хранится готовой вёрсткой. Оставь поле пустым, чтобы его не трогать,
              или вставь новый текст, и он заменит старый целиком.
            </p>
          )}
          <Label title="Анонс" hint="Пусто — возьмём начало текста">
            <input name="excerpt" defaultValue={article?.excerpt} maxLength={300} className={adminInput} />
          </Label>
          <Label title="Обложка" hint="16:9, PNG, JPG, GIF или WebP до 10 МБ. Пусто — оставить текущую.">
            {article?.coverUrl && (
              <span className="relative mb-3 block aspect-video w-72 overflow-hidden rounded-card border border-petal/60">
                <Image src={article.coverUrl} alt="Текущая обложка" fill sizes="288px" className="object-cover" />
              </span>
            )}
            <input type="file" name="cover" accept="image/png,image/jpeg,image/gif,image/webp" className="block text-text" />
          </Label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Label title="SEO-заголовок" hint="Необязательно">
              <input name="seoTitle" defaultValue={article?.seoTitle ?? ""} className={adminInput} />
            </Label>
            <Label title="SEO-описание" hint="Необязательно">
              <input name="seoDesc" defaultValue={article?.seoDesc ?? ""} className={adminInput} />
            </Label>
          </div>
        </ActionForm>
      </Card>

      {article && (
        <Card title="Удаление" className="mt-6 max-w-4xl">
          <p className="mb-4 text-muted">Статья будет удалена без возможности восстановления. Чтобы просто убрать её с сайта, поставь статус «В архиве».</p>
          <ActionForm action={deleteArticle.bind(null, article.id)} submit="Удалить статью" danger totp>
            <span />
          </ActionForm>
        </Card>
      )}
    </>
  );
}
