import { isFestive } from "@/lib/festive";

const BULBS = 28;

/** Гирлянда зимних огней под шапкой: провод провисает между лампочками, огни мягко мерцают по очереди. */
export function Garland() {
  if (!isFestive()) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-full h-5 overflow-hidden">
      <svg viewBox={`0 0 ${BULBS * 40} 20`} preserveAspectRatio="none" className="absolute inset-0 size-full text-petal">
        <path
          d={Array.from({ length: BULBS }, (_, i) => `${i === 0 ? "M" : "L"}${i * 40},1 Q${i * 40 + 20},11 ${i * 40 + 40},1`).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="absolute inset-x-0 top-0 flex justify-around">
        {Array.from({ length: BULBS }, (_, i) => (
          <span
            key={i}
            className={`garland-bulb mt-[5px] block size-2 rounded-full ${i % 3 === 0 ? "bg-paper" : i % 3 === 1 ? "bg-glow" : "bg-muted-bright"} ${i >= 14 ? "max-sm:hidden" : ""}`}
            style={{ animationDelay: `${(i % 4) * 0.6}s` }}
          />
        ))}
      </div>
    </div>
  );
}
