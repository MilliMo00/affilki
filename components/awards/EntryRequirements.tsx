import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { ENTRY_REQUIREMENTS, MAX_NOMINEES } from "@/lib/entry-rules";

/** Рамка с минимальными требованиями к участнику номинации. taken — сколько мест уже занято. */
export function EntryRequirements({ taken, className }: { taken?: number; className?: string }) {
  return (
    <section aria-labelledby="requirements-title" className={cn("rounded-petal border border-paper/70 bg-deep/60 p-5 sm:p-7", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="requirements-title" className="text-xl">
          Минимальные требования
        </h2>
        <p className="font-medium text-paper">
          {taken === undefined ? `До ${MAX_NOMINEES} участников в номинации` : `Занято мест: ${Math.min(taken, MAX_NOMINEES)} из ${MAX_NOMINEES}`}
        </p>
      </div>
      <ul className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {ENTRY_REQUIREMENTS.map((item) => (
          <li key={item.title} className="flex gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-paper text-deep">
              <Check size={16} strokeWidth={2.25} aria-hidden />
            </span>
            <span>
              <span className="block font-semibold text-paper">{item.title}</span>
              <span className="block text-muted-bright">{item.text}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-sm text-muted-bright">
        В номинацию попадает не больше {MAX_NOMINEES} участников: когда места заняты, приём заявок в неё закрывается. Заявки проверяет редактор.
      </p>
    </section>
  );
}
