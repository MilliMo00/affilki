import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, adminInput } from "@/components/admin/ActionForm";
import { Badge, Card, Check, Label, PageTitle, Table } from "@/components/admin/ui";
import { NOMINATION_ICON_NAMES } from "@/components/awards/NominationIcon";
import { requirePermission } from "@/lib/admin/auth";
import { adminUrl } from "@/lib/admin/path";
import { db } from "@/lib/db";
import { saveNomination } from "../actions";

export default async function NominationEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("awards");
  const nomination = await db.nomination.findUnique({
    where: { id: (await params).id },
    include: { nominees: { orderBy: { name: "asc" } } },
  });
  if (!nomination) notFound();
  const criteria = Array.isArray(nomination.criteria) ? (nomination.criteria as string[]).join("\n") : "";

  return (
    <>
      <PageTitle title={nomination.title}>
        <Link href={adminUrl(`/nominees/new?nomination=${nomination.id}`)} className="focus-on-bright flex h-11 items-center rounded-full bg-paper px-5 font-semibold text-deep hover:bg-text">
          Добавить участника
        </Link>
      </PageTitle>

      <Card title={nomination.requiresLegalReview ? "События" : "Участники"} className="mb-6">
        {nomination.nominees.length === 0 ? (
          <p className="text-muted">Пока никого. Нажми «Добавить участника».</p>
        ) : (
          <Table head={["Название", "Адрес", "Статус"]}>
            {nomination.nominees.map((nominee) => {
              const visible = nominee.published && (!nomination.requiresLegalReview || nominee.legalChecked);
              return (
                <tr key={nominee.id}>
                  <td>
                    <Link href={adminUrl(`/nominees/${nominee.id}`)} className="font-medium text-paper hover:underline">
                      {nominee.name}
                    </Link>
                  </td>
                  <td className="text-muted">/n/{nominee.slug}</td>
                  <td>
                    {visible ? (
                      <Badge tone="good">на сайте</Badge>
                    ) : nominee.published ? (
                      <Badge tone="warn">ждёт проверки</Badge>
                    ) : (
                      <Badge>черновик</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      <Card title="Тексты номинации">
        <ActionForm action={saveNomination.bind(null, nomination.id)} submit="Сохранить" className="max-w-3xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <Label title="Название">
              <input name="title" defaultValue={nomination.title} required className={adminInput} />
            </Label>
            <Label title="Порядок">
              <input type="number" name="order" defaultValue={nomination.order} min={1} className={adminInput} />
            </Label>
            <Label title="Иконка">
              <select name="icon" defaultValue={nomination.icon} className={adminInput}>
                {NOMINATION_ICON_NAMES.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </Label>
            <Label title="Группа фильтра">
              <select name="group" defaultValue={nomination.group} className={adminInput}>
                <option value="TEAMS">Команды и агентства</option>
                <option value="MEDIA">Медиа и каналы</option>
                <option value="MARKET">Рынок</option>
              </select>
            </Label>
          </div>
          <Label title="Слово на обложке" hint="Крупно на картинке номинации: «Команда», «Прорыв». До 16 символов. Пусто — возьмём из названия.">
            <input name="coverText" defaultValue={nomination.coverText ?? ""} maxLength={16} className={`${adminInput} max-w-sm`} />
          </Label>
          <Label title="Короткое описание" hint="Одна строка для карточки">
            <input name="shortDesc" defaultValue={nomination.shortDesc} required className={adminInput} />
          </Label>
          <Label title="Полное описание">
            <textarea name="description" defaultValue={nomination.description} rows={4} required className={adminInput} />
          </Label>
          <Label title="Критерии" hint="По одному в строке, от 1 до 8">
            <textarea name="criteria" defaultValue={criteria} rows={5} required className={adminInput} />
          </Label>
          <Label title="Кто может участвовать">
            <textarea name="eligibility" defaultValue={nomination.eligibility} rows={2} required className={adminInput} />
          </Label>
          <Check name="acceptingEntries" title="Приём участников открыт" defaultChecked={nomination.acceptingEntries} />
          <Check
            name="testVoting"
            title="Тестовое голосование"
            hint="Открывает голосование в этой номинации до общего старта сезона. Голоса настоящие и окончательные — перед запуском их нужно стереть."
            defaultChecked={nomination.testVoting}
          />
        </ActionForm>
      </Card>
    </>
  );
}
