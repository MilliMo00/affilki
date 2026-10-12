import Image from "next/image";
import { ActionForm } from "@/components/admin/ActionForm";
import { adminInput } from "@/components/admin/styles";
import { Badge, Card, Label, PageTitle } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { GENERAL_SPONSOR_SLOTS } from "@/lib/entry-rules";
import { createSponsor, deleteSponsor } from "./actions";

export default async function SponsorsAdminPage() {
  await requirePermission("ads");
  const [sponsors, nominations] = await Promise.all([
    db.sponsor.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }], include: { nomination: { select: { title: true } } } }),
    db.nomination.findMany({ orderBy: { order: "asc" }, select: { id: true, title: true } }),
  ]);
  const general = sponsors.filter((sponsor) => !sponsor.nominationId).length;
  const sold = new Set(sponsors.map((sponsor) => sponsor.nominationId));

  return (
    <>
      <PageTitle
        title="Спонсоры"
        lead={`Спонсоры премии стоят на главной, в премии, на live-табло и на страницах номинаций и участников (мест ${GENERAL_SPONSOR_SLOTS}, занято ${general}). У каждой номинации — один свой спонсор. Свободные места показываются заглушкой «Спонсорское место».`}
      />

      <Card title="Новый спонсор" className="mb-6 max-w-3xl">
        <ActionForm action={createSponsor} submit="Добавить спонсора">
          <div className="grid gap-4 sm:grid-cols-2">
            <Label title="Название">
              <input name="name" required className={adminInput} />
            </Label>
            <Label title="Ссылка">
              <input name="url" type="url" placeholder="https://" required className={adminInput} />
            </Label>
            <Label title="Что спонсирует">
              <select name="nominationId" defaultValue="" className={adminInput}>
                <option value="">Всю премию</option>
                {nominations.map((nomination) => (
                  <option key={nomination.id} value={nomination.id} disabled={sold.has(nomination.id)}>
                    Номинация: {nomination.title}
                    {sold.has(nomination.id) ? " — занята" : ""}
                  </option>
                ))}
              </select>
            </Label>
            <Label title="Порядок" hint="Для спонсоров премии: меньше — левее">
              <input name="order" type="number" defaultValue={0} min={0} max={99} className={adminInput} />
            </Label>
          </div>
          <Label title="Логотип" hint="PNG, JPG, GIF или WebP до 10 МБ. Показывается на белой плашке — лучше тёмный логотип. Без логотипа выводится название.">
            <input type="file" name="logo" accept="image/png,image/jpeg,image/gif,image/webp" className="block text-text" />
          </Label>
        </ActionForm>
      </Card>

      <Card title={`Спонсоры (${sponsors.length})`} className="max-w-3xl">
        {sponsors.length === 0 ? (
          <p className="text-muted">Пока ни одного — на сайте стоят заглушки «Спонсорское место».</p>
        ) : (
          <ul className="space-y-6">
            {sponsors.map((sponsor) => (
              <li key={sponsor.id} className="flex flex-wrap items-center gap-4 border-b border-petal/20 pb-6 last:border-0 last:pb-0">
                <span className="relative flex h-16 w-32 shrink-0 items-center justify-center overflow-hidden rounded-card border border-petal/60 bg-paper text-sm font-bold text-deep">
                  {sponsor.logoUrl ? <Image src={sponsor.logoUrl} alt={`Логотип: ${sponsor.name}`} fill sizes="128px" className="object-contain p-2" /> : sponsor.name}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-3 font-semibold text-paper">
                    {sponsor.name}
                    <Badge tone={sponsor.nomination ? "neutral" : "good"}>{sponsor.nomination ? sponsor.nomination.title : "спонсор премии"}</Badge>
                  </p>
                  <p className="mt-1 break-all text-sm text-muted">{sponsor.url}</p>
                </div>
                <ActionForm action={deleteSponsor.bind(null, sponsor.id)} submit="Убрать" danger>
                  <span />
                </ActionForm>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
