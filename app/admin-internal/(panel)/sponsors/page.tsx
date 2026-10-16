import Image from "next/image";
import { ActionForm } from "@/components/admin/ActionForm";
import { adminInput } from "@/components/admin/styles";
import { Badge, Card, Label, PageTitle } from "@/components/admin/ui";
import { LinksEditor } from "@/components/submissions/ListEditors";
import { requirePermission } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { GENERAL_SPONSOR_SLOTS } from "@/lib/entry-rules";
import { readLinks } from "@/lib/profile";
import { createSponsor, deleteSponsor, updateSponsor } from "./actions";

type SponsorRow = { id?: string; name?: string; url?: string; description?: string | null; links?: unknown; nominationId?: string | null; order?: number };

/** Поля спонсора — одинаковые для нового и для правки. */
function SponsorFields({ sponsor = {}, nominations, taken }: { sponsor?: SponsorRow; nominations: { id: string; title: string }[]; taken: Set<string | null> }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Label title="Название">
          <input name="name" defaultValue={sponsor.name} required className={adminInput} />
        </Label>
        <Label title="Сайт" hint="Сюда ведёт клик по логотипу">
          <input name="url" type="url" defaultValue={sponsor.url} placeholder="https://" required className={adminInput} />
        </Label>
        <Label title="Что спонсирует">
          <select name="nominationId" defaultValue={sponsor.nominationId ?? ""} className={adminInput}>
            <option value="">Всю премию</option>
            {nominations.map((nomination) => {
              const busy = taken.has(nomination.id) && nomination.id !== sponsor.nominationId;
              return (
                <option key={nomination.id} value={nomination.id} disabled={busy}>
                  Номинация: {nomination.title}
                  {busy ? " — занята" : ""}
                </option>
              );
            })}
          </select>
        </Label>
        <Label title="Порядок" hint="Для спонсоров премии: меньше — левее">
          <input name="order" type="number" defaultValue={sponsor.order ?? 0} min={0} max={99} className={adminInput} />
        </Label>
      </div>
      <Label title="О компании" hint="Показывается в разделе «Спонсоры» и на странице «Подробнее о спонсоре». Переносы строк сохраняются.">
        <textarea name="description" defaultValue={sponsor.description ?? ""} rows={5} maxLength={3000} className={adminInput} />
      </Label>
      <div>
        <p className="mb-1 text-sm font-medium text-paper">Дополнительные ссылки</p>
        <LinksEditor initial={readLinks(sponsor.links)} inputClass={adminInput} />
        <p className="mt-1 text-sm text-muted">Telegram, соцсети, презентация — показываются кнопками рядом с сайтом.</p>
      </div>
      <Label title="Логотип" hint="PNG, JPG, GIF или WebP до 10 МБ. Стоит на белой плашке — лучше тёмный логотип. Без логотипа выводится название. Пусто — оставить текущий.">
        <input type="file" name="logo" accept="image/png,image/jpeg,image/gif,image/webp" className="block text-text" />
      </Label>
    </>
  );
}

export default async function SponsorsAdminPage() {
  await requirePermission("ads");
  const [sponsors, nominations] = await Promise.all([
    db.sponsor.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }], include: { nomination: { select: { title: true } } } }),
    db.nomination.findMany({ orderBy: { order: "asc" }, select: { id: true, title: true } }),
  ]);
  const general = sponsors.filter((sponsor) => !sponsor.nominationId).length;
  const taken = new Set(sponsors.map((sponsor) => sponsor.nominationId));

  return (
    <>
      <PageTitle
        title="Спонсоры"
        lead={`Спонсоры премии — на каждой странице сайта и в разделе «Спонсоры» (мест ${GENERAL_SPONSOR_SLOTS}, занято ${general}). У каждой номинации — один свой спонсор: логотип на её странице и обложке, кнопка «Подробнее о спонсоре». Свободные места показываются заглушкой «Спонсорское место». Цены на сайте не указываются.`}
      />

      <Card title="Новый спонсор" className="mb-6 max-w-3xl">
        <ActionForm action={createSponsor} submit="Добавить спонсора">
          <SponsorFields nominations={nominations} taken={taken} />
        </ActionForm>
      </Card>

      <Card title={`Спонсоры (${sponsors.length})`} className="max-w-3xl">
        {sponsors.length === 0 ? (
          <p className="text-muted">Пока ни одного — на сайте стоят заглушки «Спонсорское место».</p>
        ) : (
          <ul className="space-y-6">
            {sponsors.map((sponsor) => (
              <li key={sponsor.id} className="border-b border-petal/20 pb-6 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-4">
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
                </div>
                <details className="mt-4">
                  <summary className="cursor-pointer font-medium text-paper">Изменить</summary>
                  <div className="mt-4">
                    <ActionForm action={updateSponsor.bind(null, sponsor.id)} submit="Сохранить">
                      <SponsorFields sponsor={sponsor} nominations={nominations} taken={taken} />
                    </ActionForm>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
