import { Flower } from "@/components/brand/Flower";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { STAGES, STAGE_LABELS, stageNumber, type Stage } from "@/lib/stages";

type StageIndicatorProps = {
  stage: Stage;
  /** Дата начала следующего этапа, если известна. */
  nextDate?: Date;
  size?: number;
  className?: string;
};

/** Индикатор этапа сезона: закрашено столько лепестков, сколько этапов начато. */
export function StageIndicator({ stage, nextDate, size = 56, className }: StageIndicatorProps) {
  const n = stageNumber(stage);
  const next = STAGES[n];

  return (
    <div className={cn("inline-flex items-center gap-4", className)}>
      <Flower
        size={size}
        filled={n}
        rays={false}
        rayColor="var(--deep)"
        className="shrink-0 text-paper"
        title={`Этап ${n} из ${STAGES.length}`}
      />
      <div>
        <p className="text-sm text-muted-bright">
          Этап {n} из {STAGES.length}
        </p>
        <p className="font-display text-xl font-semibold text-paper">{STAGE_LABELS[stage]}</p>
        {next && (
          <p className="text-sm text-muted-bright">
            Дальше: {STAGE_LABELS[next].toLowerCase()}
            {nextDate && ` — ${formatDate(nextDate)}`}
          </p>
        )}
      </div>
    </div>
  );
}
