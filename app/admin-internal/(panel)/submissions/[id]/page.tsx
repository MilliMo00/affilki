import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminInput } from "@/components/admin/ActionForm";
import { Badge, Card, Label, PageTitle } from "@/components/admin/ui";
import { can, requirePermission } from "@/lib/admin/auth";
import { adminUrl } from "@/lib/admin/path";
import { db } from "@/lib/db";
import { plainText } from "@/lib/markup";
import { DecisionForm } from "./DecisionForm";

const STATUS = {
  PENDING: { label: "ждёт проверки", tone: "good" },
  CHANGES_REQUESTED: { label: "у автора на правках", tone: "warn" },
  APPROVED: { label: "опубликована", tone: "neutral" },
  REJECTED: { label: "отклонена", tone: "neutral" },
} as const;

export default async function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { admin } = await requirePermission();
  const submission = await db.submission.findUnique({ where: { id: (await params).id } });
  if (!submission || !can(admin.role, submission.kind === "NOMINEE" ? "awards" : "content")) notFound();

  const nominee = submission.kind === "NOMINEE";
  const [nominations, categories, result] = await Promise.all([
    db.nomination.findMany({ orderBy: { order: "asc" }, select: { id: true, title: true, requiresLegalReview: true } }),
    db.category.findMany({ orderBy: { order: "asc" } }),
    submission.resultId
      ? nominee
        ? db.nominee.findUnique({ where: { id: submission.resultId }, select: { id: true, slug: true } })
        : db.article.findUnique({ where: { id: submission.resultId }, select: { id: true, slug: true } })
      : null,
  ]);
  const links = Array.isArray(submission.links) ? (submission.links as string[]) : [];
  const status = STATUS[submission.status];
  const firstSentence = plainText(submission.text).split(/(?<=[.!?])\s/)[0]?.slice(0, 160) ?? "";
  const legal = nominations.find((n) => n.id === submission.nominationId)?.requiresLegalReview;

  return (
    <>
      <PageTitle title={submission.title} lead={nominee ? "Заявка на участие в номинации" : "Заявка на публикацию материала"}>
        <Link href={adminUrl("/submissions")} className="font-medium text-paper underline underline-offset-4">
          Ко всем заявкам
        </Link>
      </PageTitle>

      <Card className="mb-6 max-w-3xl">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted">Статус</dt>
            <dd className="mt-1">
              <Badge tone={status.tone}>{status.label}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Автор в Telegram</dt>
            <dd className="mt-1 text-paper">
              {submission.tgUsername ? (
                <a href={`https://t.me/${submission.tgUsername}`} target="_blank" rel="noopener" className="underline underline-offset-4">
                  @{submission.tgUsername}
                </a>
              ) : (
                "без username"
              )}{" "}
              <span className="font-mono text-sm text-muted">{submission.tgUserId.toString()}</span>
            </dd>
          </div>
        </dl>
        {submission.adminComment && (
          <p className="mt-4 whitespace-pre-line rounded-card border border-petal/60 p-3 text-text">
            <span className="block text-sm font-semibold text-paper">Последний комментарий автору</span>
            {submission.adminComment}
          </p>
        )}
        {result && (
          <p className="mt-4 text-paper">
            Опубликовано:{" "}
            <Link href={nominee ? `/n/${result.slug}` : `/a/${result.slug}`} className="underline underline-offset-4">
              открыть на сайте
            </Link>
            {nominee && (
              <>
                {" · "}
                <Link href={adminUrl(`/nominees/${result.id}`)} className="underline underline-offset-4">
                  править участника
                </Link>
              </>
            )}
          </p>
        )}
      </Card>

      {submission.status === "APPROVED" ? (
        <Card className="max-w-3xl">
          <p className="text-muted">Заявка уже опубликована. Дальнейшие правки делаются в карточке участника или в статье.</p>
        </Card>
      ) : (
        <DecisionForm id={submission.id} nominee={nominee} legal={!!legal}>
          <Card title="Содержание" className="max-w-3xl">
            <div className="space-y-4">
              {nominee ? (
                <Label title="Номинация">
                  <select name="nominationId" defaultValue={submission.nominationId ?? ""} className={adminInput}>
                    {nominations.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.title}
                      </option>
                    ))}
                  </select>
                </Label>
              ) : (
                <Label title="Рубрика">
                  <select name="categorySlug" defaultValue={submission.categorySlug ?? ""} className={adminInput}>
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </Label>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Label title="Имя или команда автора">
                  <input name="authorName" defaultValue={submission.authorName} required className={adminInput} />
                </Label>
                <Label title="Контакт для связи">
                  <input name="contact" defaultValue={submission.contact} required className={adminInput} />
                </Label>
              </div>
              <Label title={nominee ? "Название участника" : "Заголовок"}>
                <input name="title" defaultValue={submission.title} required className={adminInput} />
              </Label>
              {nominee ? (
                <Label title="Одна строка для карточки" hint="Показывается под названием участника">
                  <input name="tagline" defaultValue={firstSentence} maxLength={200} className={adminInput} />
                </Label>
              ) : (
                <Label title="Анонс" hint="Короткое описание для поисковиков и соцсетей">
                  <input name="excerpt" defaultValue={plainText(submission.text).slice(0, 180)} maxLength={300} className={adminInput} />
                </Label>
              )}
              <Label title="Текст" hint={nominee ? undefined : "Разметка: ## заголовок, - список, **жирный**, [текст](https://ссылка), пустая строка между абзацами"}>
                <textarea name="text" defaultValue={submission.text} rows={nominee ? 8 : 18} required className={adminInput} />
              </Label>
              <Label title="Картинка" hint="Пусто — оставить ту, что прислал автор">
                {submission.imageUrl && (
                  <span className="relative mb-3 block h-40 w-64 overflow-hidden rounded-card border border-petal/60">
                    <Image src={submission.imageUrl} alt="Картинка из заявки" fill sizes="256px" className="object-cover" />
                  </span>
                )}
                <input type="file" name="image" accept="image/png,image/jpeg,image/gif,image/webp" className="block text-text" />
              </Label>
              <Label title="Ссылки" hint="По одной в строке">
                <textarea name="links" defaultValue={links.join("\n")} rows={3} className={adminInput} />
              </Label>
            </div>
          </Card>
        </DecisionForm>
      )}
    </>
  );
}
