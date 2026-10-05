import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AD_SLOTS, type AdSlotKey } from "@/components/ads/slots";
import { Logo } from "@/components/brand/Logo";
import { campaignStats, ctr } from "@/lib/ads";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Отчёт по рекламе", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const dayFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" });
const dateFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Moscow" });

/** Отчёт для рекламодателя по подписанной ссылке: только его кампания, только чтение. */
export default async function ReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) notFound();
  const campaign = await db.adCampaign.findUnique({ where: { reportToken: token } });
  if (!campaign || !campaign.reportExpiresAt || campaign.reportExpiresAt < new Date()) notFound();

  const days = await campaignStats(campaign.id);
  const total = days.reduce(
    (sum, day) => ({ impressions: sum.impressions + day.impressions, clicks: sum.clicks + day.clicks }),
    { impressions: 0, clicks: 0 },
  );
  const tiles = [
    { label: "Показы", value: total.impressions },
    { label: "Клики", value: total.clicks },
    { label: "CTR", value: ctr(total.clicks, total.impressions) },
  ];

  return (
    <main className="container-page py-10">
      <Logo size={32} rayColor="var(--ink)" />
      <h1 className="mt-8 text-2xl sm:text-3xl">Отчёт: {campaign.advertiser}</h1>
      <p className="mt-2 text-muted">
        {AD_SLOTS[campaign.slotKey as AdSlotKey]?.label ?? campaign.slotKey} · {dateFmt.format(campaign.startsAt)} — {dateFmt.format(campaign.endsAt)}
      </p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-card border border-petal/40 bg-deep/30 p-5">
            <dd className="font-display text-3xl font-bold tabular-nums text-paper">{tile.value}</dd>
            <dt className="mt-1 text-muted">{tile.label}</dt>
          </div>
        ))}
      </dl>

      <h2 className="mb-4 mt-10 text-xl">По дням</h2>
      {days.length === 0 ? (
        <p className="text-muted">Данных пока нет.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left tabular-nums">
            <thead>
              <tr className="[&_th]:border-b [&_th]:border-petal/40 [&_th]:px-3 [&_th]:py-2 [&_th]:text-sm [&_th]:font-medium [&_th]:text-muted">
                <th>День</th>
                <th>Показы</th>
                <th>Уникальные</th>
                <th>Клики</th>
                <th>Уникальные</th>
                <th>CTR</th>
              </tr>
            </thead>
            <tbody className="[&_td]:border-b [&_td]:border-petal/20 [&_td]:px-3 [&_td]:py-2">
              {days.map((day) => (
                <tr key={day.day.toISOString()}>
                  <td>{dayFmt.format(day.day)}</td>
                  <td>{day.impressions}</td>
                  <td>{day.uniqueImpressions}</td>
                  <td>{day.clicks}</td>
                  <td>{day.uniqueClicks}</td>
                  <td>{ctr(day.clicks, day.impressions)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-8 text-sm text-muted">Показ засчитывается, когда баннер виден на экране не меньше чем наполовину в течение секунды. Боты не учитываются.</p>
    </main>
  );
}
