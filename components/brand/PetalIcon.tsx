import { PETAL_PATH } from "./geometry";

/** Одиночный лепесток: маркер списков, заглушка слота, иконка голоса. */
export function PetalIcon({
  size = 16,
  filled = false,
  className,
}: {
  size?: number;
  filled?: boolean;
  className?: string;
}) {
  return (
    <svg viewBox="-44 -104 88 104" width={(size * 88) / 104} height={size} className={className} aria-hidden>
      <path
        d={PETAL_PATH}
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={7}
        strokeLinejoin="round"
      />
    </svg>
  );
}
