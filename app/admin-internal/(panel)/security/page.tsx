import Link from "next/link";
import { ActionForm } from "@/components/admin/ActionForm";
import { adminInput } from "@/components/admin/styles";
import { Badge, Card, Label, PageTitle, Table } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { adminUrl } from "@/lib/admin/path";
import { db } from "@/lib/db";
import { addAdmin, changeAdmin, revokeSessions } from "./actions";

const timeFmt = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" });
const ROLES = { OWNER: "Владелец", EDITOR: "Редактор", ANALYST: "Аналитик" } as const;
const PAGE = 50;

export default async function SecurityPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { session: current } = await requirePermission("security");
  const { q = "", page = "1" } = await searchParams;
  const pageNumber = Math.max(1, Number(page) || 1);
  const where = q ? { OR: [{ action: { contains: q } }, { adminName: { contains: q, mode: "insensitive" as const } }, { entityType: { contains: q } }] } : {};

  const [admins, sessions, log, logTotal] = await Promise.all([
    db.adminUser.findMany({ orderBy: { createdAt: "asc" } }),
    db.adminSession.findMany({ where: { revokedAt: null, expiresAt: { gt: new Date() } }, include: { admin: true }, orderBy: { lastSeenAt: "desc" } }),
    db.auditLog.findMany({ where, orderBy: { ts: "desc" }, skip: (pageNumber - 1) * PAGE, take: PAGE }),
    db.auditLog.count({ where }),
  ]);

  return (
    <>
      <PageTitle title="Безопасность" lead="Админы, активные сессии и журнал действий. Любое изменение здесь требует свежий код." />

      <Card title="Админы" className="mb-6">
        <ul className="space-y-8">
          {admins.map((admin) => (
            <li key={admin.id} className="border-b border-petal/20 pb-6 last:border-0 last:pb-0">
              <p className="flex flex-wrap items-center gap-3 text-paper">
                <span className="font-semibold">{admin.name}</span>
                <span className="font-mono text-sm text-muted">{admin.tgId.toString()}</span>
                <Badge tone={admin.isActive ? "good" : "neutral"}>{admin.isActive ? ROLES[admin.role] : "отключён"}</Badge>
                {!admin.totpSecretEnc && <Badge tone="warn">2FA не настроена</Badge>}
              </p>
              <div className="mt-3 grid gap-4 lg:grid-cols-3">
                <ActionForm action={changeAdmin.bind(null, admin.id, "role")} submit="Сменить роль" totp>
                  <select name="role" defaultValue={admin.role} aria-label="Роль" className={adminInput}>
                    <option value="OWNER">Владелец — всё</option>
                    <option value="EDITOR">Редактор — контент, премия, реклама</option>
                    <option value="ANALYST">Аналитик — только статистика</option>
                  </select>
                </ActionForm>
                <ActionForm action={changeAdmin.bind(null, admin.id, admin.isActive ? "deactivate" : "activate")} submit={admin.isActive ? "Отключить" : "Включить"} danger={admin.isActive} totp>
                  <span />
                </ActionForm>
                <ActionForm action={changeAdmin.bind(null, admin.id, "reset2fa")} submit="Сбросить 2FA" danger totp>
                  <span />
                </ActionForm>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Добавить админа" className="mb-6 max-w-2xl">
        <ActionForm action={addAdmin} submit="Добавить" totp>
          <div className="grid gap-4 sm:grid-cols-2">
            <Label title="Telegram ID" hint="Числовой, можно узнать у @userinfobot">
              <input name="tgId" inputMode="numeric" required className={adminInput} />
            </Label>
            <Label title="Имя">
              <input name="name" required className={adminInput} />
            </Label>
          </div>
          <Label title="Роль">
            <select name="role" defaultValue="EDITOR" className={`${adminInput} max-w-md`}>
              <option value="EDITOR">Редактор — контент, премия, реклама</option>
              <option value="ANALYST">Аналитик — только статистика</option>
              <option value="OWNER">Владелец — всё</option>
            </select>
          </Label>
        </ActionForm>
      </Card>

      <Card title={`Активные сессии (${sessions.length})`} className="mb-6">
        <Table head={["Админ", "Устройство", "Страна", "Вход", "Активность"]}>
          {sessions.map((session) => (
            <tr key={session.id}>
              <td className="font-medium text-paper">
                {session.admin.name} {session.id === current.id && <span className="text-sm font-normal text-muted">· это ты</span>}
              </td>
              <td>{session.uaLabel}</td>
              <td>{session.country ?? "—"}</td>
              <td className="tabular-nums">{timeFmt.format(session.createdAt)}</td>
              <td className="tabular-nums">{timeFmt.format(session.lastSeenAt)}</td>
            </tr>
          ))}
        </Table>
        <ActionForm action={revokeSessions.bind(null, null)} submit="Завершить все сессии, кроме этой" danger totp className="mt-5">
          <span />
        </ActionForm>
      </Card>

      <Card title={`Журнал действий (${logTotal})`}>
        <form className="mb-4 flex max-w-md gap-2">
          <input name="q" defaultValue={q} placeholder="Действие, админ или сущность" aria-label="Поиск по журналу" className={adminInput} />
          <button type="submit" className="h-11 shrink-0 rounded-full border border-petal px-5 font-semibold text-paper hover:border-glow">
            Найти
          </button>
        </form>
        <Table head={["Время (МСК)", "Админ", "Действие", "Над чем", "Изменения"]}>
          {log.map((entry) => (
            <tr key={entry.id.toString()}>
              <td className="whitespace-nowrap tabular-nums">{timeFmt.format(entry.ts)}</td>
              <td>{entry.adminName}</td>
              <td className="font-mono text-sm">{entry.action}</td>
              <td className="text-sm text-muted">
                {entry.entityType}
                {entry.entityId && ` · ${entry.entityId.slice(0, 12)}`}
              </td>
              <td>
                {(entry.before || entry.after) && (
                  <details>
                    <summary className="cursor-pointer text-sm text-paper">показать</summary>
                    <pre className="mt-2 max-w-md overflow-x-auto whitespace-pre-wrap break-all text-sm text-muted">
                      {JSON.stringify({ before: entry.before, after: entry.after }, null, 1)}
                    </pre>
                  </details>
                )}
              </td>
            </tr>
          ))}
        </Table>
        <div className="mt-4 flex gap-4">
          {pageNumber > 1 && (
            <Link href={adminUrl(`/security?q=${encodeURIComponent(q)}&page=${pageNumber - 1}`)} className="font-medium text-paper underline underline-offset-4">
              Новее
            </Link>
          )}
          {pageNumber * PAGE < logTotal && (
            <Link href={adminUrl(`/security?q=${encodeURIComponent(q)}&page=${pageNumber + 1}`)} className="font-medium text-paper underline underline-offset-4">
              Старше
            </Link>
          )}
        </div>
      </Card>
    </>
  );
}
