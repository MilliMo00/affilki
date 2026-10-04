import { cn } from "@/lib/cn";
import { Flower } from "./Flower";
import { Wordmark } from "./Wordmark";

type LogoProps = {
  /** Высота цветка в px; вордмарк масштабируется от неё. */
  size?: number;
  awards?: boolean;
  /** Цвет фона под логотипом — им рисуются лучи. */
  rayColor?: string;
  className?: string;
};

export function Logo({ size = 36, awards = false, rayColor, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center text-paper", className)} style={{ gap: size * 0.28 }}>
      <Flower size={size} rayColor={rayColor} />
      <span className="flex flex-col items-center" style={{ gap: size * 0.16 }}>
        <Wordmark height={awards ? size * 0.5 : size * 0.56} />
        {awards && (
          <span
            className="font-sans font-semibold leading-none"
            style={{ fontSize: size * 0.2, letterSpacing: "0.42em", marginRight: "-0.42em" }}
          >
            AWARDS
          </span>
        )}
      </span>
    </span>
  );
}
