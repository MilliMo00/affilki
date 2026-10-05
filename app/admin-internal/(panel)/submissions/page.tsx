import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, PageTitle, Table } from "@/components/admin/ui";
import { can, requirePermission } from "@/lib/admin/auth";
import { adminUrl } from "@/lib/admin/path";
import { db } from "@/lib/db";
import { cn } from "@/lib/cn";

const TABS = [
  { key: "PENDING", label: "Ждут проверки" },
  { key: "CHANGES_REQUESTED", label: "У автора на правках" },
  { key: "APPROVED", label: "Опубликованы" },
  { key: "REJECTED", label: "Отклонены" },
] as const;

const timeFmt = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" });

export default async function SubmissionsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { admin } = await requirePermission();
  const kinds = [...(can(admin.role, "awards") ? (["NOMINEE"] as const) : []), ...(can(admin.role, "content") ? (["ARTICLE"] as const) : [])];
  // Ни премии, ни контента в правах — раздела для этого админа нет.
  if (kinds.length === 0) notFound();
  const requested = (await searchParams).status;
  const status = TABS.find((tab) => tab.key === requested)?.key ?? "PENDING";

  const [rows, counts, nominations] = await Promise.all([
    db.submission.findMany({ where: { status, kind: { in: kinds } }, orderBy: { updatedAt: "desc" }, take: 200 }),
    db.submission.groupBy({ by: ["status"], where: { kind: { in: kinds } }, _count: { _all: true } }),
    db.nomination.findMany({ select: { id: true, title: true } }),
  ]);
  const countOf = (key: string) => counts.find((c) => c.status === key)?._count._all ?? 0;
  const nominationTitle = new Map(nominations.map((n) => [n.id, n.title]));

  return (
    <>
      <PageTitle title="Заявки" lead="Заявки на участие в номинациях и на публикацию материалов. Открой заявку, чтобы поправить и принять решение." />
      <nav aria-label="Статус заявок" className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={adminUrl(`/submissions?status=${tab.key}`)}
            aria-current={tab.key === status ? "page" : undefined}
            className={cn(
              "flex h-10 items-center rounded-full border px-4 font-medium",
              tab.key === status ? "border-paper bg-paper text-deep" : "border-petal/60 text-text hover:border-glow",
            )}
          >
            {tab.label} · {countOf(tab.key)}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="rounded-card border border-petal/40 px-6 py-12 text-center text-muted">Здесь пусто.</p>
      ) : (
        <Table head={["Обновлена", "Тип", "Название", "Куда", "Автор"]}>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="whitespace-nowrap tabular-nums text-muted">{timeFmt.format(row.updatedAt)}</td>
              <td>{row.kind === "NOMINEE" ? <Badge tone="good">номинация</Badge> : <Badge>статья</Badge>}</td>
              <td>
                <Link href={adminUrl(`/submissions/${row.id}`)} className="font-medium text-paper hover:underline">
                  {row.title}
                </Link>
              </td>
              <td className="text-muted">{row.kind === "NOMINEE" ? (nominationTitle.get(row.nominationId ?? "") ?? "—") : row.categorySlug}</td>
              <td>
                {row.authorName}
                {row.tgUsername && <span className="text-muted"> · @{row.tgUsername}</span>}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
