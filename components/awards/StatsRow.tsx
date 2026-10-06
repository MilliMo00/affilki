import { formatCount, plural } from "@/lib/format";

type Stats = { votes: number; nominees: number; nominations: number; daysLeft: number; daysToStart: number };

/** Строка живой статистики под hero. Только общие числа — без разбивки по участникам. */
export function StatsRow({ stats }: { stats: Stats }) {
  const items = [
    // До старта голосов ещё нет — вместо нуля показываем, сколько осталось до голосования.
    stats.daysToStart > 0
      ? { value: stats.daysToStart, label: `${plural(stats.daysToStart, ["день", "дня", "дней"])} до голосования` }
      : { value: formatCount(stats.votes), label: `${plural(stats.votes, ["голос", "голоса", "голосов"])} отдано` },
    { value: stats.nominees, label: plural(stats.nominees, ["участник", "участника", "участников"]) },
    { value: stats.nominations, label: plural(stats.nominations, ["номинация", "номинации", "номинаций"]) },
    { value: stats.daysLeft, label: `${plural(stats.daysLeft, ["день", "дня", "дней"])} до итогов` },
  ];

  return (
    <section aria-label="Статистика сезона" className="border-y border-petal/40 bg-deep">
      <dl className="container-page grid grid-cols-2 gap-y-6 py-6 md:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <dd className="font-display text-2xl font-bold tabular-nums text-paper sm:text-3xl">{item.value}</dd>
            <dt className="mt-1 text-sm text-muted">{item.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
