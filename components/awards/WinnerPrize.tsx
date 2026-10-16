import { Award, Crown, Mic, Pin, Smartphone, Trophy, type LucideIcon } from "lucide-react";
import { Flower } from "@/components/brand/Flower";
import { cn } from "@/lib/cn";

// Что получает победитель номинации. Здесь можно цвет пыльцы: он на сайте только для победителей.

const PERKS: { Icon: LucideIcon; title: string; text: string }[] = [
  { Icon: Crown, title: "Место в строке победителей", text: "Название и логотип — в разделе победителей на сайте AFFILKI. Навсегда." },
  { Icon: Award, title: "Статус победителя на сайте", text: "Золотая отметка «Победитель AFFILKI Awards» на странице команды." },
  { Icon: Pin, title: "Пост в закрепе канала", text: "Отдельный пост о победе в Telegram-канале AFFILKI — закреплён навсегда." },
  { Icon: Smartphone, title: "Сторис в канале", text: "Публикуем победителя в сторис канала — его увидит вся аудитория рынка." },
];

export function WinnerPrize({ year, className }: { year: number; className?: string }) {
  return (
    <section aria-labelledby="prize-title" className={cn("relative overflow-hidden bg-ink", className)}>
      {/* Тёплое свечение и цветок — праздничный фон блока о призе. */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 85% 0%, rgba(255,214,107,0.18) 0%, transparent 55%), radial-gradient(ellipse at 0% 100%, rgba(123,98,240,0.35) 0%, transparent 60%)" }} />
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 aspect-square w-80 text-pollen/10 sm:w-[28rem]">
        <Flower size="100%" rays={false} rayColor="var(--ink)" />
      </div>

      <div className="container-page relative py-14 sm:py-16">
        <p className="inline-flex items-center gap-2 rounded-full border border-pollen/60 px-3 py-1 text-sm font-semibold text-pollen">
          <Trophy size={16} strokeWidth={2} aria-hidden />
          Приз победителю
        </p>
        <h2 id="prize-title" className="mt-4 max-w-3xl text-2xl sm:text-4xl">
          Что получает победитель номинации
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-muted-bright">Не просто строчка в итогах — признание рынка, которое остаётся с командой.</p>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
          {/* Главный приз — особый формат материала. */}
          <article className="relative flex flex-col overflow-hidden rounded-petal border-2 border-pollen bg-gradient-to-br from-deep via-surface to-indigo p-6 sm:p-8">
            <span className="absolute right-5 top-5 rounded-full bg-pollen px-3 py-1 text-sm font-bold text-ink">Главный приз</span>
            <span className="flex size-14 items-center justify-center rounded-full bg-pollen text-ink">
              <Mic size={28} strokeWidth={1.75} aria-hidden />
            </span>
            <h3 className="mt-6 text-xl sm:text-2xl">Обзор и интервью победителя</h3>
            <p className="mt-3 text-lg text-paper">
              Большой материал о команде в особом формате «Победитель AFFILKI Awards {year}»: интервью с основателями, история, кейсы
              и цифры — полноценный рассказ о том, за что команду выбрал рынок.
            </p>
            <ul className="mt-6 space-y-2 text-muted-bright">
              {["Своё оформление — отличается от обычных статей ленты", "Отметка номинации и года победы", "Публикация на сайте и анонс в канале"].map((item) => (
                <li key={item} className="flex items-baseline gap-3">
                  <span aria-hidden className="size-2 shrink-0 translate-y-[-1px] rounded-full bg-pollen" />
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <ul className="grid gap-4 sm:grid-cols-2">
            {PERKS.map(({ Icon, title, text }) => (
              <li key={title} className="flex flex-col gap-3 rounded-petal border border-pollen/40 bg-deep/70 p-5 backdrop-blur-sm">
                <span className="flex size-11 items-center justify-center rounded-full border border-pollen/60 text-pollen">
                  <Icon size={22} strokeWidth={1.75} aria-hidden />
                </span>
                <h3 className="font-sans text-lg font-semibold text-paper">{title}</h3>
                <p className="text-muted-bright">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
