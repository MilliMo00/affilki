import Link from "next/link";
import { Badge, PageTitle, Table } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { adminUrl } from "@/lib/admin/path";
import { db } from "@/lib/db";

export default async function NominationsPage() {
  await requirePermission("awards");
  const season = await db.season.findFirst({
    orderBy: { year: "desc" },
    include: { nominations: { orderBy: { order: "asc" }, include: { nominees: { select: { published: true, legalChecked: true } } } } },
  });

  return (
    <>
      <PageTitle title="Номинации и участники" lead="Открой номинацию, чтобы править её тексты и участников." />
      <Table head={["№", "Номинация", "На сайте", "Скрыто", "Приём"]}>
        {season?.nominations.map((nomination) => {
          const visible = nomination.nominees.filter((n) => n.published && (!nomination.requiresLegalReview || n.legalChecked)).length;
          return (
            <tr key={nomination.id}>
              <td className="tabular-nums text-muted">{nomination.order}</td>
              <td>
                <Link href={adminUrl(`/nominations/${nomination.id}`)} className="font-medium text-paper hover:underline">
                  {nomination.title}
                </Link>
                {nomination.requiresLegalReview && <span className="ml-2 text-sm text-muted">нужна проверка</span>}
                {nomination.testVoting && <span className="ml-2 text-sm text-danger">тестовое голосование</span>}
              </td>
              <td className="tabular-nums">{visible}</td>
              <td className="tabular-nums">{nomination.nominees.length - visible}</td>
              <td>{nomination.acceptingEntries ? <Badge tone="good">открыт</Badge> : <Badge>закрыт</Badge>}</td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}
