import Image from "next/image";
import { AD_SLOTS, type AdSlotKey } from "@/components/ads/slots";
import { ActionForm } from "@/components/admin/ActionForm";
import { adminInput } from "@/components/admin/styles";
import { Badge, Card, Label, PageTitle, Table } from "@/components/admin/ui";
import { ctr, slotStats } from "@/lib/ads";
import { requirePermission } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { hoursAgo } from "@/lib/time";
import { createCampaign, createReportLink, deleteCampaign } from "./actions";

const dateFmt = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" });

export default async function AdsAdminPage() {
  await requirePermission("ads");
  const keys = Object.keys(AD_SLOTS) as AdSlotKey[];
  const from = hoursAgo(24 * 30);
  const now = new Date();
  const [campaigns, stats] = await Promise.all([
    db.adCampaign.findMany({ orderBy: { startsAt: "desc" } }),
    Promise.all(keys.map((key) => slotStats(key, from))),
  ]);

  return (
    <>
      <PageTitle title="Реклама" lead="Слот продан, пока идёт кампания. В остальное время показывается заглушка «Слот свободен»." />

      <Card title="Слоты за 30 дней" className="mb-6">
        <Table head={["Слот", "Размер", "Сейчас", "Показы", "Клики", "CTR", "Клики по заглушке"]}>
          {keys.map((key, i) => {
            const active = campaigns.find((c) => c.slotKey === key && c.startsAt <= now && c.endsAt >= now);
            return (
              <tr key={key}>
                <td>
                  <span className="font-medium text-paper">{AD_SLOTS[key].label}</span>
                  <span className="block font-mono text-sm text-muted">{key}</span>
                </td>
                <td className="text-sm text-muted">
                  {AD_SLOTS[key].desktop}
                  <span className="block">моб.: {AD_SLOTS[key].mobile}</span>
                </td>
                <td>{active ? <Badge tone="good">{active.advertiser}</Badge> : <Badge>свободен</Badge>}</td>
                <td className="tabular-nums">{stats[i].sold.impressions}</td>
                <td className="tabular-nums">{stats[i].sold.clicks}</td>
                <td className="tabular-nums">{ctr(stats[i].sold.clicks, stats[i].sold.impressions)}</td>
                <td className="tabular-nums">
                  {stats[i].placeholder.clicks}
                  <span className="text-sm text-muted"> · {stats[i].placeholder.uniqueClicks} чел.</span>
                </td>
              </tr>
            );
          })}
        </Table>
        <p className="mt-3 text-sm text-muted">Клики по заглушке — это люди, которые нажали «Слот свободен»: возможные рекламодатели.</p>
      </Card>

      <Card title="Новая кампания" className="mb-6 max-w-3xl">
        <ActionForm action={createCampaign} submit="Создать кампанию">
          <div className="grid gap-4 sm:grid-cols-2">
            <Label title="Слот">
              <select name="slotKey" className={adminInput}>
                {keys.map((key) => (
                  <option key={key} value={key}>
                    {AD_SLOTS[key].label} — {AD_SLOTS[key].desktop}
                  </option>
                ))}
              </select>
            </Label>
            <Label title="Рекламодатель">
              <input name="advertiser" required className={adminInput} />
            </Label>
            <Label title="Начало (МСК)">
              <input type="datetime-local" name="startsAt" required className={adminInput} />
            </Label>
            <Label title="Конец (МСК)">
              <input type="datetime-local" name="endsAt" required className={adminInput} />
            </Label>
          </div>
          <Label title="Ссылка">
            <input name="targetUrl" type="url" placeholder="https://" required className={adminInput} />
          </Label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Label title="Картинка или гифка" hint="До 10 МБ, под размер слота. Тяжёлая гифка будет долго грузиться у посетителей.">
              <input type="file" name="image" accept="image/png,image/jpeg,image/gif,image/webp" required className="block text-text" />
            </Label>
            <Label title="Версия для телефона" hint="Необязательно">
              <input type="file" name="mobileImage" accept="image/png,image/jpeg,image/gif,image/webp" className="block text-text" />
            </Label>
          </div>
        </ActionForm>
      </Card>

      <Card title={`Кампании (${campaigns.length})`}>
        {campaigns.length === 0 ? (
          <p className="text-muted">Пока ни одной.</p>
        ) : (
          <ul className="space-y-8">
            {campaigns.map((campaign) => {
              const state = campaign.endsAt < now ? "завершена" : campaign.startsAt > now ? "запланирована" : "идёт";
              return (
                <li key={campaign.id} className="border-b border-petal/20 pb-6 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-start gap-4">
                    <span className="relative block h-20 w-40 shrink-0 overflow-hidden rounded-card border border-petal/60">
                      <Image src={campaign.imageUrl} alt={`Баннер: ${campaign.advertiser}`} fill unoptimized sizes="160px" className="object-cover" />
                    </span>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-3 font-semibold text-paper">
                        {campaign.advertiser} <Badge tone={state === "идёт" ? "good" : "neutral"}>{state}</Badge>
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {AD_SLOTS[campaign.slotKey as AdSlotKey]?.label ?? campaign.slotKey} · {dateFmt.format(campaign.startsAt)} — {dateFmt.format(campaign.endsAt)}
                      </p>
                      <p className="mt-1 break-all text-sm text-muted">{campaign.targetUrl}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <ActionForm action={createReportLink.bind(null, campaign.id)} submit="Ссылка на отчёт">
                      <Label title="Срок действия ссылки, дней" hint={campaign.reportToken ? "Новая ссылка отключит прежнюю" : "Отчёт только для чтения — можно отправить рекламодателю"}>
                        <input type="number" name="days" defaultValue={30} min={1} max={365} className={`${adminInput} max-w-32`} />
                      </Label>
                    </ActionForm>
                    <ActionForm action={deleteCampaign.bind(null, campaign.id)} submit="Удалить кампанию" danger totp>
                      <span />
                    </ActionForm>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
