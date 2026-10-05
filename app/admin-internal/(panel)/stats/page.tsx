import Link from "next/link";
import { Card, PageTitle, Table } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { adminUrl } from "@/lib/admin/path";
import { PERIODS, resolvePeriod } from "@/lib/admin/period";
import { countries, devices, nomineeSources, overview, sources, topArticles, topPages, voteFunnel, votesByDay, type Row } from "@/lib/admin/stats";
import { cn } from "@/lib/cn";

/** Горизонтальные полосы: длина — доля от максимума в списке. */
function Bars({ rows, empty = "Данных пока нет." }: { rows: Row[]; empty?: string }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  if (rows.length === 0) return <p className="text-muted">{empty}</p>;
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-text">{row.label}</span>
            <span className="shrink-0 tabular-nums text-paper">{row.value}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-deep">
            <div className="h-full rounded-full bg-glow" style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function delta(now: number, before: number) {
  if (before === 0) return now === 0 ? "без изменений" : "раньше было 0";
  const change = Math.round(((now - before) / before) * 100);
  return `${change > 0 ? "+" : ""}${change}% к прошлому периоду`;
}

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requirePermission("stats");
  const { period, from, to, prevFrom, prevTo } = resolvePeriod((await searchParams).days);

  const [now, before, pages, src, dev, geo, funnel, byDay, nominees, articles] = await Promise.all([
    overview(from, to),
    overview(prevFrom, prevTo),
    topPages(from, to),
    sources(from, to),
    devices(from, to),
    countries(from, to),
    voteFunnel(from, to),
    votesByDay(from, to),
    nomineeSources(from, to),
    topArticles(from, to),
  ]);

  const tiles = [
    { label: "Посетители", value: now.visitors, note: delta(now.visitors, before.visitors) },
    { label: "Просмотры", value: now.views, note: delta(now.views, before.views) },
    { label: "Голоса", value: now.votes, note: delta(now.votes, before.votes) },
    {
      label: "Клик «Голосовать» → голос",
      value: now.conversion === null ? "—" : `${Math.round(now.conversion * 100)}%`,
      note: `${now.voteClicks} нажатий`,
    },
    { label: "Клики по рекламе", value: now.adClicks, note: delta(now.adClicks, before.adClicks) },
  ];
  const csv = (report: string) => adminUrl(`/api/export?report=${report}&days=${period.key}`);
  const exportLink = (report: string) => (
    <a href={csv(report)} className="text-sm font-medium text-paper underline underline-offset-4">
      Скачать CSV
    </a>
  );
  const firstStep = funnel.steps[0]?.value ?? 0;

  return (
    <>
      <PageTitle title="Статистика" lead="Только агрегаты. Боты и админы в статистику не попадают.">
        <nav aria-label="Период" className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <Link
              key={p.key}
              href={adminUrl(`/stats?days=${p.key}`)}
              aria-current={p.key === period.key ? "page" : undefined}
              className={cn(
                "flex h-10 items-center rounded-full border px-4 font-medium",
                p.key === period.key ? "border-paper bg-paper text-deep" : "border-petal/60 text-text hover:border-glow",
              )}
            >
              {p.label}
            </Link>
          ))}
        </nav>
      </PageTitle>

      <dl className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-card border border-petal/40 bg-deep/30 p-5">
            <dd className="font-display text-3xl font-bold tabular-nums text-paper">{tile.value}</dd>
            <dt className="mt-1 text-text">{tile.label}</dt>
            <p className="mt-1 text-sm text-muted">{tile.note}</p>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Воронка голосования">
          <ol className="space-y-3">
            {funnel.steps.map((step, i) => {
              const previous = i === 0 ? null : funnel.steps[i - 1].value;
              return (
                <li key={step.label}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-text">{step.label}</span>
                    <span className="tabular-nums text-paper">{step.value}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-deep">
                    <div className="h-full rounded-full bg-glow" style={{ width: `${firstStep > 0 ? Math.min(100, (step.value / firstStep) * 100) : 0}%` }} />
                  </div>
                  {previous !== null && previous > 0 && step.value < previous && (
                    <p className="mt-1 text-sm text-muted">отвал на шаге: {Math.round((1 - step.value / previous) * 100)}%</p>
                  )}
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-sm text-muted">Вход через бота нужен один раз, поэтому шагов входа закономерно меньше, чем голосов.</p>
          <div className="mt-4">{exportLink("funnel")}</div>
        </Card>

        <Card title="Почему голос не прошёл">
          <Bars rows={funnel.reasons} empty="Отказов за период не было." />
        </Card>

        <Card title="Голоса по дням">
          <Bars rows={byDay} empty="Голосов за период не было." />
          <div className="mt-4">{exportLink("votes")}</div>
        </Card>

        <Card title="Источники трафика">
          <Bars rows={src} />
          <div className="mt-4">{exportLink("sources")}</div>
        </Card>

        <Card title="Устройства">
          <Bars rows={dev} />
          <div className="mt-4">{exportLink("devices")}</div>
        </Card>

        <Card title="Страны">
          <Bars rows={geo} />
          <div className="mt-4">{exportLink("countries")}</div>
        </Card>
      </div>

      <Card title="Откуда приходят на страницы участников" className="mt-6">
        {nominees.length === 0 ? (
          <p className="text-muted">Данных пока нет.</p>
        ) : (
          <Table head={["Участник", "Источник", "Посетители"]}>
            {nominees.map((row) => (
              <tr key={`${row.nominee}:${row.source}`}>
                <td className="font-medium text-paper">{row.nominee}</td>
                <td>{row.source}</td>
                <td className="tabular-nums">{row.visitors}</td>
              </tr>
            ))}
          </Table>
        )}
        <div className="mt-4">{exportLink("nominees")}</div>
      </Card>

      <Card title="Статьи" className="mt-6">
        {articles.length === 0 ? (
          <p className="text-muted">Данных пока нет.</p>
        ) : (
          <Table head={["Статья", "Просмотры", "Читатели", "Средняя глубина"]}>
            {articles.map((row) => (
              <tr key={row.slug}>
                <td className="font-medium text-paper">{row.slug}</td>
                <td className="tabular-nums">{row.views}</td>
                <td className="tabular-nums">{row.readers}</td>
                <td className="tabular-nums">{row.depth === null ? "—" : `${Math.round(row.depth)}%`}</td>
              </tr>
            ))}
          </Table>
        )}
        <div className="mt-4">{exportLink("articles")}</div>
      </Card>

      <Card title="Страницы" className="mt-6">
        {pages.length === 0 ? (
          <p className="text-muted">Данных пока нет.</p>
        ) : (
          <Table head={["Страница", "Просмотры", "Посетители"]}>
            {pages.map((row) => (
              <tr key={row.label}>
                <td className="font-medium text-paper">{row.label}</td>
                <td className="tabular-nums">{row.value}</td>
                <td className="tabular-nums">{row.extra}</td>
              </tr>
            ))}
          </Table>
        )}
        <div className="mt-4">{exportLink("pages")}</div>
      </Card>
    </>
  );
}
