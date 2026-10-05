import { ActionForm } from "@/components/admin/ActionForm";
import { Badge, Card, PageTitle, Table } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { tallySeason } from "@/lib/admin/tally";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { setResultsPublished } from "../votes/actions";

export default async function WinnersPage() {
  await requirePermission("votes");
  const season = await db.season.findFirst({ orderBy: { year: "desc" } });
  if (!season) return <PageTitle title="Победители" lead="Сезон ещё не создан." />;

  const tally = await tallySeason(season.id);
  const ended = new Date() > season.votingEndsAt;

  return (
    <>
      <PageTitle title="Победители" lead="Итоговая таблица по номинациям. Побеждает тот, у кого больше учтённых голосов." />

      <Card title="Публикация итогов" className="mb-6 max-w-2xl">
        {season.resultsPublished ? (
          <>
            <p className="mb-4 text-paper">Итоги опубликованы: на сайте видны места и проценты.</p>
            <ActionForm action={setResultsPublished.bind(null, false)} submit="Отменить публикацию" danger totp>
              <span />
            </ActionForm>
          </>
        ) : ended ? (
          <>
            <p className="mb-4 text-text">
              Голосование закончилось. После публикации на сайте откроются места и проценты, а этап сменится на «Церемония». Перед
              этим проверь раздел «Голоса» на накрутку.
            </p>
            <ActionForm action={setResultsPublished.bind(null, true)} submit="Опубликовать итоги" danger totp>
              <span />
            </ActionForm>
          </>
        ) : (
          <p className="text-muted">Голосование идёт до {formatDate(season.votingEndsAt)}. Опубликовать итоги можно после его окончания.</p>
        )}
      </Card>

      {tally.map((group) => (
        <Card key={group.nomination.id} title={`${group.nomination.order}. ${group.nomination.title}`} className="mb-6">
          <Table head={["Место", "Участник", "Голосов", "Доля", ""]}>
            {group.rows.map((row) => {
              // При равенстве голосов победителя автоматически не называем — решает владелец.
              const tie = row.votes > 0 && group.rows.filter((other) => other.votes === row.votes).length > 1;
              return (
                <tr key={row.nominee.id}>
                  <td className="tabular-nums text-muted">{row.place}</td>
                  <td className="font-medium text-paper">{row.nominee.name}</td>
                  <td className="tabular-nums">{row.votes}</td>
                  <td className="tabular-nums">{Math.round(row.share * 100)}%</td>
                  <td>
                    {tie ? <Badge tone="warn">равенство</Badge> : row.place === 1 && row.votes > 0 && <Badge tone="good">победитель</Badge>}
                  </td>
                </tr>
              );
            })}
          </Table>
        </Card>
      ))}
    </>
  );
}
