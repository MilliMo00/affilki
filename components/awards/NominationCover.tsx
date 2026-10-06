import { Flower } from "@/components/brand/Flower";
import { cn } from "@/lib/cn";
import { NominationIcon } from "./NominationIcon";

// Обложка номинации — плакат: крупное слово, большая контурная иконка и обрезанный цветок.
// Композиция выбирается по порядковому номеру, поэтому у соседних карточек она разная.
const VARIANTS = [
  { bg: "radial-gradient(ellipse at 12% 20%, #7B62F0 0%, #4A33C0 48%, #30209D 100%)", flower: "right-[-6%] top-[-70%] h-[210%] rotate-[8deg]", icon: "right-[4%] bottom-[-18%]", tilt: "rotate-[-10deg]" },
  { bg: "linear-gradient(112deg, #30209D 0%, #30209D 56%, #5A45CC 56%, #7B62F0 100%)", flower: "left-[-10%] top-[-90%] h-[200%] rotate-[-18deg]", icon: "right-[5%] top-[-14%]", tilt: "rotate-[12deg]" },
  { bg: "radial-gradient(ellipse at 88% 80%, #7B62F0 0%, #4A33C0 46%, #2A1B8F 100%)", flower: "right-[18%] top-[-30%] h-[190%] rotate-[36deg]", icon: "right-[3%] bottom-[-22%]", tilt: "rotate-[6deg]" },
  { bg: "linear-gradient(200deg, #6C5BCE 0%, #4A33C0 45%, #1B1160 100%)", flower: "right-[-12%] bottom-[-110%] h-[220%] rotate-[-30deg]", icon: "right-[6%] top-[-10%]", tilt: "rotate-[-14deg]" },
  { bg: "radial-gradient(ellipse at 50% 0%, #7B62F0 0%, #4A33C0 52%, #30209D 100%)", flower: "left-[30%] top-[-20%] h-[200%] rotate-[52deg]", icon: "right-[4%] bottom-[-16%]", tilt: "rotate-[9deg]" },
  { bg: "linear-gradient(68deg, #2A1B8F 0%, #4A33C0 50%, #7B62F0 100%)", flower: "right-[-4%] top-[-110%] h-[230%] rotate-[-44deg]", icon: "right-[5%] bottom-[-20%]", tilt: "rotate-[-6deg]" },
  { bg: "radial-gradient(ellipse at 30% 100%, #7B62F0 0%, #4A33C0 44%, #30209D 100%)", flower: "right-[10%] top-[-60%] h-[200%] rotate-[20deg]", icon: "right-[4%] top-[-12%]", tilt: "rotate-[14deg]" },
  { bg: "linear-gradient(150deg, #5A45CC 0%, #30209D 60%, #120B3D 100%)", flower: "left-[-14%] bottom-[-120%] h-[220%] rotate-[14deg]", icon: "right-[5%] bottom-[-18%]", tilt: "rotate-[-12deg]" },
  { bg: "radial-gradient(ellipse at 70% 30%, #7B62F0 0%, #4A33C0 42%, #30209D 100%)", flower: "right-[-10%] top-[-40%] h-[210%] rotate-[-8deg]", icon: "right-[4%] bottom-[-24%]", tilt: "rotate-[8deg]" },
];

type NominationCoverProps = {
  /** Порядковый номер — только чтобы выбрать композицию; на обложке не печатается. */
  number: number;
  icon: string;
  /** Крупное слово плаката. */
  text: string;
  className?: string;
};

export function NominationCover({ number, icon, text, className }: NominationCoverProps) {
  const variant = VARIANTS[(number - 1 + VARIANTS.length) % VARIANTS.length];
  const word = text.toUpperCase();
  // Буква Unbounded почти квадратная: слово должно уместиться примерно в две трети ширины.
  const size = Math.min(15, 62 / word.length);

  return (
    // container-type: size — размеры внутри считаются от ширины и высоты самой обложки,
    // поэтому плакат одинаково собирается и на карточке, и в широкой шапке номинации.
    <div aria-hidden className={cn("grain relative overflow-hidden", className)} style={{ background: variant.bg, containerType: "size" }}>
      <div className={cn("absolute aspect-square text-paper/[0.14]", variant.flower)}>
        <Flower size="100%" rays={false} rayColor="var(--indigo)" />
      </div>

      {/* Иконка как иллюстрация: крупная, тонким контуром, частично уходит за край. */}
      <div className={cn("absolute aspect-square h-[125%] text-paper/35", variant.icon, variant.tilt)}>
        <NominationIcon name={icon} size={24} className="size-full [&>*]:[stroke-width:1.1]" />
      </div>

      <div className="absolute inset-0 flex items-end p-[7cqh] pl-[5cqw]">
        <span className="font-display font-extrabold leading-none tracking-tight text-paper" style={{ fontSize: `min(${size}cqw, 46cqh)` }}>
          {word}
        </span>
      </div>
    </div>
  );
}
