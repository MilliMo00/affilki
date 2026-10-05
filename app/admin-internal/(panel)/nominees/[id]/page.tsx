import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, adminInput } from "@/components/admin/ActionForm";
import { Card, Check, Label, PageTitle } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { adminUrl } from "@/lib/admin/path";
import { db } from "@/lib/db";
import { deleteNominee, saveNominee } from "../../nominations/actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ nomination?: string }> };

export default async function NomineeEditPage({ params, searchParams }: Props) {
  await requirePermission("awards");
  const { id } = await params;
  const isNew = id === "new";

  const nominee = isNew ? null : await db.nominee.findUnique({ where: { id }, include: { _count: { select: { votes: true } } } });
  if (!isNew && !nominee) notFound();
  const nomination = await db.nomination.findUnique({ where: { id: nominee?.nominationId ?? (await searchParams).nomination ?? "" } });
  if (!nomination) notFound();

  const links = (nominee?.links ?? {}) as { site?: string; tg?: string };
  const sources = Array.isArray(nominee?.sources) ? (nominee.sources as string[]).join("\n") : "";
  const events = nomination.requiresLegalReview;

  return (
    <>
      <PageTitle title={isNew ? "Новый участник" : nominee!.name} lead={`Номинация: ${nomination.title}`}>
        <Link href={adminUrl(`/nominations/${nomination.id}`)} className="font-medium text-paper underline underline-offset-4">
          К номинации
        </Link>
      </PageTitle>

      <Card className="max-w-3xl">
        <ActionForm action={saveNominee.bind(null, nomination.id, id)} submit={isNew ? "Создать" : "Сохранить"}>
          {events && (
            <p className="rounded-card border border-petal/60 p-4 text-text">
              Это номинация событий. Название — нейтральное описание события без оценок и обвинений. Описание — только
              факты, со ссылками на публичные источники.
            </p>
          )}
          <Label title={events ? "Название события" : "Название"}>
            <input name="name" defaultValue={nominee?.name} required className={adminInput} />
          </Label>
          <Label title="Адрес страницы" hint="Латиница, цифры и дефисы. Страница будет по адресу /n/адрес — менять после запуска не стоит: сломаются ссылки.">
            <input name="slug" defaultValue={nominee?.slug} required className={adminInput} />
          </Label>
          <Label title="Одна строка описания">
            <input name="tagline" defaultValue={nominee?.tagline ?? ""} className={adminInput} />
          </Label>
          <Label title="Полное описание" hint="Показывается на странице участника">
            <textarea name="description" defaultValue={nominee?.description ?? ""} rows={4} className={adminInput} />
          </Label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Label title="Сайт">
              <input name="site" type="url" defaultValue={links.site ?? ""} placeholder="https://" className={adminInput} />
            </Label>
            <Label title="Telegram">
              <input name="tg" type="url" defaultValue={links.tg ?? ""} placeholder="https://t.me/" className={adminInput} />
            </Label>
          </div>
          <Label title="Логотип" hint="PNG, JPG, GIF или WebP до 2 МБ. Пусто — оставить текущий.">
            <input type="file" name="logo" accept="image/png,image/jpeg,image/gif,image/webp" className="block text-text" />
          </Label>
          <Label title="Источники" hint={events ? "По одной ссылке в строке. Обязательно хотя бы одна." : "По одной ссылке в строке. Необязательно."}>
            <textarea name="sources" defaultValue={sources} rows={3} className={adminInput} />
          </Label>
          {events && (
            <Label title="Комментарий стороны" hint="Право на ответ: выводится на карточке, если заполнено">
              <textarea name="rightOfReply" defaultValue={nominee?.rightOfReply ?? ""} rows={3} className={adminInput} />
            </Label>
          )}
          {!events && <input type="hidden" name="rightOfReply" value="" />}
          <Check name="published" title="Опубликовать" hint="Без галочки участник остаётся черновиком" defaultChecked={nominee?.published ?? false} />
          {events ? (
            <Check name="legalChecked" title="Проверено" hint="Я проверил формулировки и источники. Без этой отметки карточка на сайт не попадёт." defaultChecked={nominee?.legalChecked ?? false} />
          ) : (
            <input type="hidden" name="legalChecked" value="" />
          )}
        </ActionForm>
      </Card>

      {nominee && (
        <Card title="Удаление" className="mt-6 max-w-3xl">
          <p className="mb-4 text-muted">
            {nominee._count.votes > 0
              ? `За участника отдано голосов: ${nominee._count.votes}. Удалить его нельзя — сними с публикации.`
              : "Участник будет удалён без возможности восстановления."}
          </p>
          {nominee._count.votes === 0 && <ActionForm action={deleteNominee.bind(null, nominee.id)} submit="Удалить участника" danger totp><span /></ActionForm>}
        </Card>
      )}
    </>
  );
}
