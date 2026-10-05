import Link from "next/link";
import { Card, PageTitle } from "@/components/admin/ui";
import { can, requirePermission } from "@/lib/admin/auth";
import { adminUrl } from "@/lib/admin/path";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { STAGE_LABELS } from "@/lib/stages";
import { hoursAgo } from "@/lib/time";

export default async function AdminHome() {
  const { admin } = await requirePermission();
  const season = await db.season.findFirst({ orderBy: { year: "desc" } });
  const dayAgo = hoursAgo(24);

  const [votes, votesDay, nominees, hidden, requests, visitors] = await Promise.all([
    db.vote.count({ where: { voidedAt: null } }),
    db.vote.count({ where: { voidedAt: null, createdAt: { gte: dayAgo } } }),
    db.nominee.count({ where: { published: true } }),
    db.nominee.count({ where: { OR: [{ published: false }, { legalChecked: false, nomination: { requiresLegalReview: true } }] } }),
    db.submission.count({ where: { status: "PENDING" } }),
    db.analyticsEvent.groupBy({ by: ["sessionId"], where: { type: "page_view", ts: { gte: dayAgo } } }).then((rows) => rows.length),
  ]);

  const tiles = [
    { label: "Голосов всего", value: votes, show: can(admin.role, "votes") },
    { label: "Голосов за сутки", value: votesDay, show: can(admin.role, "votes") },
    { label: "Участников на сайте", value: nominees, show: true },
    { label: "Участников скрыто", value: hidden, show: can(admin.role, "awards") },
    { label: "Заявок ждёт проверки", value: requests, show: can(admin.role, "content") },
    { label: "Визитов за сутки", value: visitors, show: can(admin.role, "stats") },
  ].filter((tile) => tile.show);

  return (
    <>
      <PageTitle title="Обзор" />
      {season && (
        <Card className="mb-6">
          <p className="text-lg text-paper">
            {season.title} · этап «{STAGE_LABELS[season.stage]}»
          </p>
          <p className="mt-1 text-muted">
            Голосование: {formatDate(season.votingStartsAt)} — {formatDate(season.votingEndsAt)}.{" "}
            {season.resultsPublished ? "Итоги опубликованы." : "Итоги не опубликованы."}
          </p>
          {can(admin.role, "season") && (
            <Link href={adminUrl("/season")} className="mt-3 inline-block font-medium text-paper underline underline-offset-4">
              Настройки сезона
            </Link>
          )}
        </Card>
      )}
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-card border border-petal/40 bg-deep/30 p-5">
            <dd className="font-display text-3xl font-bold tabular-nums text-paper">{tile.value}</dd>
            <dt className="mt-1 text-muted">{tile.label}</dt>
          </div>
        ))}
      </dl>
    </>
  );
}
