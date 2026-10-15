import Link from "next/link";
import { ActionForm } from "@/components/admin/ActionForm";
import { adminInput } from "@/components/admin/styles";
import { Badge, Card, Label, PageTitle, Table } from "@/components/admin/ui";
import { detectAnomalies, median } from "@/lib/admin/anomalies";
import { requirePermission } from "@/lib/admin/auth";
import { adminUrl } from "@/lib/admin/path";
import { tallySeason } from "@/lib/admin/tally";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { banAccount, setTestVoting, unbanAccount } from "./actions";

export default async function VotesPage() {
  await requirePermission("votes");
  const season = await db.season.findFirst({ orderBy: { year: "desc" } });
  if (!season) return <PageTitle title="Голоса" lead="Сезон ещё не создан." />;

  const testing = season.testVoting && new Date() < season.votingStartsAt;
  const [testVotes, tally, votes, bans] = await Promise.all([
    db.vote.count({ where: { isTest: true, nomination: { seasonId: season.id } } }),
    tallySeason(season.id),
    db.vote.findMany({
      where: { voidedAt: null, nomination: { seasonId: season.id } },
      select: { nomineeId: true, tgUserId: true, tgUsername: true, hasAvatar: true, ipHash: true, deviceHash: true, createdAt: true },
    }),
    db.tgBan.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const medianTgId = median(votes.map((v) => v.tgUserId));
  const byNominee = new Map<string, typeof votes>();
  for (const vote of votes) byNominee.set(vote.nomineeId, [...(byNominee.get(vote.nomineeId) ?? []), vote]);
  const flagsOf = (nomineeId: string) =>
    detectAnomalies(byNominee.get(nomineeId) ?? [], { burstFactor: season.maxVotesPerTenMinFactor, medianTgId });

  const flagged = tally.flatMap((group) =>
    group.rows.map((row) => ({ row, title: group.nomination.title, flags: flagsOf(row.nominee.id) })).filter((item) => item.flags.length > 0),
  );

  return (
    <>
      <PageTitle title="Голоса" lead="Точные счётчики видны только здесь. На сайте — по настройкам live-табло." />

      <Card title="Тестовое голосование" className={`mb-6 ${testing ? "border-danger" : ""}`}>
        {new Date() >= season.votingStartsAt ? (
          <p className="text-muted">
            Настоящее голосование уже идёт — тест недоступен.
            {testVotes > 0 && ` Тестовых голосов осталось: ${testVotes}; в табло и итогах они не учитываются.`}
          </p>
        ) : (
          <>
            <p className="mb-4 text-text">
              {testing ? (
                <>
                  <Badge tone="warn">идёт тест</Badge> Голосовать можно во всех номинациях, live-табло открыто, на сайте висит плашка
                  «тестовый режим». Тестовых голосов сейчас: <b className="tabular-nums">{testVotes}</b>.
                </>
              ) : (
                <>
                  Включи, чтобы до {formatDate(season.votingStartsAt)} пройти весь путь голоса на живом сайте: вход через бота, голос,
                  квитанция, live-табло. Когда выключишь, все тестовые голоса удалятся.
                </>
              )}
            </p>
            {testing ? (
              <ActionForm action={setTestVoting.bind(null, false)} submit="Выключить и удалить тестовые голоса" danger>
                <span />
              </ActionForm>
            ) : (
              <ActionForm action={setTestVoting.bind(null, true)} submit="Включить тестовое голосование">
                {testVotes > 0 ? <p className="text-muted">Остались голоса прошлого теста: {testVotes}. Они удалятся при следующем выключении.</p> : <span />}
              </ActionForm>
            )}
          </>
        )}
      </Card>

      <Card title={`Подозрительное (${flagged.length})`} className="mb-6">
        {flagged.length === 0 ? (
          <p className="text-muted">Признаков накрутки не найдено.</p>
        ) : (
          <ul className="space-y-4">
            {flagged.map(({ row, title, flags }) => (
              <li key={row.nominee.id}>
                <Link href={adminUrl(`/votes/${row.nominee.id}`)} className="font-semibold text-paper hover:underline">
                  {row.nominee.name}
                </Link>
                <span className="text-muted"> · {title}</span>
                <ul className="mt-1 space-y-1">
                  {flags.map((flag) => (
                    <li key={flag.code} className="text-danger">
                      {flag.text}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {tally.map((group) => (
        <Card key={group.nomination.id} title={`${group.nomination.order}. ${group.nomination.title} — ${group.total}`} className="mb-6">
          <Table head={["Место", "Участник", "Голосов", "Доля", "Не учтено", ""]}>
            {group.rows.map((row) => (
              <tr key={row.nominee.id}>
                <td className="tabular-nums text-muted">{row.place}</td>
                <td>
                  <Link href={adminUrl(`/votes/${row.nominee.id}`)} className="font-medium text-paper hover:underline">
                    {row.nominee.name}
                  </Link>
                </td>
                <td className="tabular-nums">{row.votes}</td>
                <td className="tabular-nums">{Math.round(row.share * 100)}%</td>
                <td className="tabular-nums text-muted">{row.excluded || ""}</td>
                <td>{flagsOf(row.nominee.id).length > 0 && <Badge tone="warn">проверить</Badge>}</td>
              </tr>
            ))}
          </Table>
        </Card>
      ))}

      <Card title="Бан аккаунта" className="mb-6 max-w-2xl">
        <ActionForm action={banAccount} submit="Забанить" danger totp>
          <Label title="Telegram ID" hint="Голоса этого аккаунта перестанут учитываться, новые он отдать не сможет">
            <input name="tgUserId" inputMode="numeric" required className={adminInput} />
          </Label>
          <Label title="Причина">
            <input name="reason" required className={adminInput} />
          </Label>
        </ActionForm>
      </Card>

      <Card title={`Забаненные (${bans.length})`}>
        {bans.length === 0 ? (
          <p className="text-muted">Никого.</p>
        ) : (
          <ul className="space-y-6">
            {bans.map((ban) => (
              <li key={ban.tgUserId.toString()}>
                <p className="text-paper">
                  <span className="font-mono">{ban.tgUserId.toString()}</span> · {ban.reason}{" "}
                  <span className="text-muted">· {formatDate(ban.createdAt)}</span>
                </p>
                <ActionForm action={unbanAccount.bind(null, ban.tgUserId.toString())} submit="Снять бан" totp className="mt-2">
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
