import Link from "next/link";
import { ActionForm } from "@/components/admin/ActionForm";
import { adminInput } from "@/components/admin/styles";
import { Card, Label, PageTitle } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { adminUrl } from "@/lib/admin/path";
import { db } from "@/lib/db";
import { createInvite } from "../actions";

/** Редакция готовит заявку за команду. Дальше — анкета на странице заявки и ссылка для команды. */
export default async function NewInvitePage() {
  await requirePermission("awards");
  const nominations = await db.nomination.findMany({ where: { acceptingEntries: true }, orderBy: { order: "asc" }, select: { id: true, title: true } });

  return (
    <>
      <PageTitle title="Заявка за команду" lead="Заполняешь анкету сам, а команда только проверяет и подтверждает её по личной ссылке.">
        <Link href={adminUrl("/submissions?status=INVITED")} className="font-medium text-paper underline underline-offset-4">
          Все подготовленные
        </Link>
      </PageTitle>
      <Card className="max-w-3xl">
        <ol className="mb-6 list-decimal space-y-1 pl-5 text-text">
          <li>Выбери номинацию и впиши название команды.</li>
          <li>На следующей странице заполни анкету: о команде, достижения, кейсы, ссылки, логотип — и сохрани.</li>
          <li>Скопируй ссылку и отправь команде. Они войдут через бота и подтвердят.</li>
        </ol>
        <ActionForm action={createInvite} submit="Создать черновик">
          <Label title="Номинация">
            <select name="nominationId" required className={adminInput} defaultValue="">
              <option value="" disabled>
                Выбери номинацию
              </option>
              {nominations.map((nomination) => (
                <option key={nomination.id} value={nomination.id}>
                  {nomination.title}
                </option>
              ))}
            </select>
          </Label>
          <Label title="Название команды" hint="Так участник будет называться на сайте">
            <input name="title" required className={adminInput} />
          </Label>
          <Label title="Контакт команды" hint="Telegram или канал — для тебя, на сайт не попадает">
            <input name="contact" placeholder="@username или https://t.me/…" className={adminInput} />
          </Label>
        </ActionForm>
      </Card>
    </>
  );
}
