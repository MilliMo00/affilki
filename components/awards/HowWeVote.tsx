import Link from "next/link";

const STEPS = [
  { title: "Нажми «Голосовать»", text: "У участника, которого хочешь поддержать. Один голос в каждой номинации." },
  { title: "Подтверди в боте", text: "Голос привязан к Telegram-аккаунту — так мы отсекаем накрутку." },
  { title: "Пройди проверку", text: "Короткая капча, и голос засчитан. Изменить его потом нельзя." },
];

export function HowWeVote() {
  return (
    <section aria-labelledby="how-title" className="container-page py-12">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="how-title" className="text-2xl">
          Как голосуем
        </h2>
        <Link href="/rules" className="font-medium text-paper underline decoration-muted-bright underline-offset-4 hover:decoration-paper">
          Полные правила
        </Link>
      </div>
      <ol className="mt-6 grid gap-6 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <span className="font-display text-3xl font-bold text-paper/50" aria-hidden>
              {i + 1}
            </span>
            <div>
              <h3 className="font-sans text-lg font-semibold">{step.title}</h3>
              <p className="mt-1 text-muted-bright">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
