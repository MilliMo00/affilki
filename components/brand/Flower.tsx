import { FLOWER_VIEWBOX, PETAL_ANGLES, PETAL_PATH, RAYS } from "./geometry";

type FlowerProps = {
  size?: number | string;
  /** Сколько лепестков закрашено (по часовой, начиная с верхнего). Остальные — контуром. */
  filled?: number;
  petalColor?: string;
  /** Цвет лучей и центра — обычно цвет фона, на котором лежит цветок. */
  rayColor?: string;
  rays?: boolean;
  rayWidth?: number;
  /** Если задан — цветок озвучивается скринридером, иначе он декоративный. */
  title?: string;
  className?: string;
};

export function Flower({
  size = 40,
  filled = 5,
  petalColor = "currentColor",
  rayColor = "var(--indigo)",
  rays = true,
  rayWidth = 2.6,
  title,
  className,
}: FlowerProps) {
  return (
    <svg
      viewBox={FLOWER_VIEWBOX}
      width={size}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <g data-part="petals">
        {PETAL_ANGLES.map((angle, i) => {
          const on = i < filled;
          return (
            <path
              key={angle}
              d={PETAL_PATH}
              transform={`rotate(${angle})`}
              fill={petalColor}
              fillOpacity={on ? 1 : 0.14}
              stroke={petalColor}
              strokeOpacity={on ? 0 : 0.6}
              strokeWidth={2.5}
            />
          );
        })}
      </g>
      {rays && (
        <g data-part="rays" stroke={rayColor} strokeWidth={rayWidth} strokeLinecap="round">
          {RAYS.map((ray) => (
            <line key={ray.angle} x1={0} y1={-ray.from} x2={0} y2={-ray.to} transform={`rotate(${ray.angle})`} />
          ))}
        </g>
      )}
      <circle r={9} fill={rayColor} />
      <circle r={4} fill={petalColor} />
    </svg>
  );
}
