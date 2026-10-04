import { FLOWER_VIEWBOX, PETAL_ANGLES, PETAL_PATH } from "./geometry";

/** Лоадер: лепестки загораются по очереди. */
export function Loader({ size = 40, label = "Загрузка" }: { size?: number; label?: string }) {
  return (
    <svg viewBox={FLOWER_VIEWBOX} width={size} height={size} role="status" aria-label={label} className="text-paper">
      {PETAL_ANGLES.map((angle, i) => (
        <path
          key={angle}
          d={PETAL_PATH}
          transform={`rotate(${angle})`}
          fill="currentColor"
          className="loader-petal"
          style={{ animationDelay: `${i * 0.25}s` }}
        />
      ))}
    </svg>
  );
}
