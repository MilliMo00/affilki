import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, adminInput } from "@/components/admin/ActionForm";
import { Badge, Card, Label, PageTitle } from "@/components/admin/ui";
import { detectAnomalies, median } from "@/lib/admin/anomalies";
import { requirePermission } from "@/lib/admin/auth";
import { adminUrl } from "@/lib/admin/path";
import { db } from "@/lib/db";
import { restoreVote, voidVotes } from "../actions";

const timeFmt = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Moscow" });

export default async function NomineeVotesPage({ params }: { params: Promise<{ nomineeId: string }> }) {
  await requirePermission("votes");
  const nominee = await db.nominee.findUnique({
    where: { id: (await params).nomineeId },
    include: { nomination: { include: { season: true } }, votes: { orderBy: { createdAt: "desc" }, take: 2000 } },
  });
  if (!nominee) notFound();

  const season = nominee.nomination.season;
  const [allIds, bans] = await Promise.all([
    db.vote.findMany({ where: { voidedAt: null, nomination: { seasonId: season.id } }, select: { tgUserId: true } }),
    db.tgBan.findMany({ select: { tgUserId: true } }),
  ]);
  const banned = new Set(bans.map((b) => b.tgUserId));
  const active = nominee.votes.filter((v) => !v.voidedAt);
  const voided = nominee.votes.filter((v) => v.voidedAt);
  const flags = detectAnomalies(active, { burstFactor: season.maxVotesPerTenMinFactor, medianTgId: median(allIds.map((v) => v.tgUserId)) });

  // Сколько разных аккаунтов пришло с того же адреса — видно прямо в строке.
  const perIp = new Map<string, number>();
  for (const vote of active) perIp.set(vote.ipHash, (perIp.get(vote.ipHash) ?? 0) + 1);

  return (
    <>
      <PageTitle title={nominee.name} lead={`${nominee.nomination.title} · учтено голосов: ${active.filter((v) => !banned.has(v.tgUserId)).length}`}>
        <Link href={adminUrl("/votes")} className="font-medium text-paper underline underline-offset-4">
          Ко всем голосам
        </Link>
      </PageTitle>

      {flags.length > 0 && (
        <Card title="Признаки накрутки" className="mb-6">
          <ul className="space-y-1">
            {flags.map((flag) => (
              <li key={flag.code} className="text-danger">
                {flag.text}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title={`Голоса (${active.length})`} className="mb-6">
        {active.length === 0 ? (
          <p className="text-muted">Голосов нет.</p>
        ) : (
          <ActionForm action={voidVotes} submit="Аннулировать выбранные" danger totp>
            <div className="max-h-[32rem] overflow-auto rounded-card border border-petal/30">
              <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
                <thead className="sticky top-0 bg-ink">
                  <tr className="[&_th]:px-3 [&_th]:py-2 [&_th]:font-medium [&_th]:text-muted">
                    <th>
                      <span className="sr-only">Выбрать</span>
                    </th>
                    <th>Время (МСК)</th>
                    <th>Telegram ID</th>
                    <th>Username</th>
                    <th>Фото</th>
                    <th>Адрес</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="[&_td]:border-t [&_td]:border-petal/20 [&_td]:px-3 [&_td]:py-2">
                  {active.map((vote) => (
                    <tr key={vote.id}>
                      <td>
                        <input type="checkbox" name="vote" value={vote.id} aria-label={`Голос ${vote.tgUserId}`} className="size-5 accent-[#7B62F0]" />
                      </td>
                      <td className="tabular-nums">{timeFmt.format(vote.createdAt)}</td>
                      <td className="font-mono">{vote.tgUserId.toString()}</td>
                      <td>{vote.tgUsername ? `@${vote.tgUsername}` : <span className="text-danger">нет</span>}</td>
                      <td>{vote.hasAvatar ? "есть" : <span className="text-danger">нет</span>}</td>
                      <td className="font-mono text-muted">
                        {vote.ipHash.slice(0, 8)}
                        {(perIp.get(vote.ipHash) ?? 0) > 1 && <span className="ml-2 text-danger">×{perIp.get(vote.ipHash)}</span>}
                      </td>
                      <td>{banned.has(vote.tgUserId) && <Badge tone="warn">бан</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Label title="Причина аннулирования">
              <input name="reason" required className={`${adminInput} max-w-xl`} />
            </Label>
          </ActionForm>
        )}
      </Card>

      {voided.length > 0 && (
        <Card title={`Аннулированные (${voided.length})`}>
          <ul className="space-y-6">
            {voided.map((vote) => (
              <li key={vote.id}>
                <p className="text-paper">
                  <span className="font-mono">{vote.tgUserId.toString()}</span> · {timeFmt.format(vote.createdAt)} ·{" "}
                  <span className="text-muted">{vote.voidReason}</span>
                </p>
                <ActionForm action={restoreVote.bind(null, vote.id)} submit="Вернуть голос" totp className="mt-2">
                  <span />
                </ActionForm>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
