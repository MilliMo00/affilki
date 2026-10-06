import { ActionForm } from "@/components/admin/ActionForm";
import { Badge, Card, PageTitle } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { SEGMENTS, audienceCounts, isRunning, type Segment } from "@/lib/broadcast";
import { db } from "@/lib/db";
import { BroadcastForm } from "./BroadcastForm";
import { controlBroadcast } from "./actions";

const timeFmt = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" });
const STATUS = { SENDING: ["идёт", "good"], DONE: ["завершена", "neutral"], CANCELLED: ["остановлена", "warn"] } as const;

export default async function BroadcastsPage() {
  await requirePermission("broadcast");
  const [counts, history] = await Promise.all([audienceCounts(), db.broadcast.findMany({ orderBy: { createdAt: "desc" }, take: 30 })]);
  const segments = (Object.keys(SEGMENTS) as Segment[]).map((key) => ({ key, label: SEGMENTS[key], count: counts.segments[key] }));

  const tiles = [
    { label: "Могут получить рассылку", value: counts.segments.all },
    { label: "Всего нажали «Старт»", value: counts.total },
    { label: "Отписались от рассылок", value: counts.unsubscribed },
    { label: "Заблокировали бота", value: counts.blocked },
  ];

  return (
    <>
      <PageTitle title="Рассылки" lead="Сообщения от имени бота всем, кто нажал в нём «Старт»." />

      <dl className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-card border border-petal/40 bg-deep/30 p-5">
            <dd className="font-display text-3xl font-bold tabular-nums text-paper">{tile.value}</dd>
            <dt className="mt-1 text-muted">{tile.label}</dt>
          </div>
        ))}
      </dl>

      <Card title="Новое сообщение" className="mb-6 max-w-3xl">
        <BroadcastForm segments={segments} />
        <p className="mt-4 text-sm text-muted">
          Рассылку получают все, кто нажал «Старт» в боте и не заблокировал его. Отказаться от рассылок человек может командой
          /stop в боте; квитанции о голосах и ответы по заявкам ему приходят как раньше.
        </p>
      </Card>

      <Card title={`История (${history.length})`}>
        {history.length === 0 ? (
          <p className="text-muted">Рассылок ещё не было.</p>
        ) : (
          <ul className="space-y-6">
            {history.map((item) => {
              const [label, tone] = STATUS[item.status];
              const processed = item.sent + item.failed + item.blocked;
              // «Идёт» в базе, но этот процесс её не отправляет — значит, сервер перезапускался посреди отправки.
              const stalled = item.status === "SENDING" && !isRunning(item.id);
              return (
                <li key={item.id} className="border-b border-petal/20 pb-6 last:border-0 last:pb-0">
                  <p className="flex flex-wrap items-center gap-3 text-paper">
                    <span className="tabular-nums text-muted">{timeFmt.format(item.createdAt)}</span>
                    <Badge tone={tone}>{stalled ? "прервана" : label}</Badge>
                    <span>{SEGMENTS[item.segment as Segment] ?? item.segment}</span>
                  </p>
                  <p className="mt-2 line-clamp-3 whitespace-pre-line text-text">{item.text}</p>
                  <p className="mt-2 text-sm tabular-nums text-muted">
                    Обработано {processed} из {item.total} · доставлено {item.sent} · заблокировали бота {item.blocked} · ошибок {item.failed}
                    {item.imageUrl && " · с картинкой"}
                    {item.buttonText && ` · кнопка «${item.buttonText}»`}
                  </p>
                  {item.status === "SENDING" && (
                    <ActionForm action={controlBroadcast.bind(null, item.id, "stop")} submit="Остановить" danger className="mt-3">
                      <span />
                    </ActionForm>
                  )}
                  {(stalled || (item.status === "CANCELLED" && processed < item.total)) && (
                    <ActionForm action={controlBroadcast.bind(null, item.id, "resume")} submit={`Продолжить: осталось ${item.total - processed}`} totp className="mt-3">
                      <span />
                    </ActionForm>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
