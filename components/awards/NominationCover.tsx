import { Flower } from "@/components/brand/Flower";
import { cn } from "@/lib/cn";
import { NominationIcon } from "./NominationIcon";

// Обложки номинаций в стиле постера: градиент, обрезанный цветок и крупная иконка.
// Композиция выбирается по номеру номинации, поэтому у соседних карточек она разная.
const VARIANTS = [
  { bg: "radial-gradient(ellipse at 20% 30%, #7B62F0 0%, #4A33C0 45%, #30209D 100%)", flower: "left-[52%] top-[-55%] w-[78%] rotate-[8deg]" },
  { bg: "radial-gradient(ellipse at 80% 20%, #7B62F0 0%, #4A33C0 50%, #2A1B8F 100%)", flower: "left-[-22%] top-[-20%] w-[70%] rotate-[-18deg]" },
  { bg: "radial-gradient(ellipse at 50% 100%, #7B62F0 0%, #4A33C0 48%, #30209D 100%)", flower: "left-[18%] top-[12%] w-[64%] rotate-[36deg]" },
  { bg: "radial-gradient(ellipse at 85% 85%, #7B62F0 0%, #4A33C0 46%, #30209D 100%)", flower: "left-[56%] top-[-10%] w-[62%] rotate-[-30deg]" },
  { bg: "radial-gradient(ellipse at 15% 85%, #7B62F0 0%, #4A33C0 50%, #2A1B8F 100%)", flower: "left-[-14%] top-[-70%] w-[84%] rotate-[20deg]" },
  { bg: "radial-gradient(ellipse at 50% 0%, #7B62F0 0%, #4A33C0 52%, #30209D 100%)", flower: "left-[40%] top-[20%] w-[72%] rotate-[-8deg]" },
  { bg: "radial-gradient(ellipse at 30% 60%, #7B62F0 0%, #4A33C0 44%, #30209D 100%)", flower: "left-[60%] top-[-40%] w-[58%] rotate-[52deg]" },
  { bg: "radial-gradient(ellipse at 70% 50%, #7B62F0 0%, #4A33C0 48%, #2A1B8F 100%)", flower: "left-[-30%] top-[5%] w-[76%] rotate-[-44deg]" },
  { bg: "radial-gradient(ellipse at 45% 35%, #7B62F0 0%, #4A33C0 42%, #30209D 100%)", flower: "left-[30%] top-[-62%] w-[90%] rotate-[14deg]" },
];

type NominationCoverProps = {
  number: number;
  icon: string;
  /** Крупный вариант — для шапки страницы номинации. */
  large?: boolean;
  className?: string;
};

export function NominationCover({ number, icon, large, className }: NominationCoverProps) {
  const variant = VARIANTS[(number - 1 + VARIANTS.length) % VARIANTS.length];

  return (
    <div aria-hidden className={cn("grain relative overflow-hidden", className)} style={{ background: variant.bg }}>
      <div className={cn("absolute aspect-square text-paper/20", variant.flower)}>
        <Flower size="100%" rays={false} rayColor="var(--indigo)" />
      </div>
      <div className={cn("absolute inset-0 flex items-center", large ? "px-8 sm:px-12" : "px-5 sm:px-6")}>
        <span
          className={cn(
            "flex items-center justify-center rounded-full border border-paper/40 bg-ink/35 text-paper backdrop-blur-sm",
            large ? "size-24 sm:size-28" : "size-16",
          )}
        >
          <NominationIcon name={icon} size={large ? 52 : 32} />
        </span>
      </div>
      <span
        className={cn(
          "absolute font-display font-bold tabular-nums text-paper/50",
          large ? "bottom-4 right-6 text-5xl sm:right-10" : "bottom-2 right-5 text-3xl",
        )}
      >
        {String(number).padStart(2, "0")}
      </span>
    </div>
  );
}
