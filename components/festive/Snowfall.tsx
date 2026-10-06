import { isFestive } from "@/lib/festive";

// Детерминированный «случайный» ряд: у сервера и браузера снежинки на одних и тех же местах.
const pseudo = (i: number, salt: number) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const FLAKES = Array.from({ length: 34 }, (_, i) => ({
  left: pseudo(i, 1) * 100,
  size: 3 + pseudo(i, 2) * 5,
  duration: 9 + pseudo(i, 3) * 12,
  delay: -pseudo(i, 4) * 20,
  // Где снежинка «замирает», если анимации отключены.
  rest: Math.round(pseudo(i, 7) * 90),
  opacity: 0.35 + pseudo(i, 5) * 0.55,
  sway: 6 + pseudo(i, 6) * 6,
  // Каждая пятая — настоящая снежинка, остальные — мягкие точки.
  star: i % 5 === 0,
}));

/**
 * Падающий снег поверх фона секции. Родитель должен быть relative + overflow-hidden.
 * Только CSS: без скриптов и без нагрузки на страницу. При «уменьшении движения» снег стоит на месте.
 */
export function Snowfall({ density = 1 }: { density?: number }) {
  if (!isFestive()) return null;
  const flakes = FLAKES.slice(0, Math.round(FLAKES.length * density));

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {flakes.map((flake, i) => (
        // Колонка высотой с секцию сдвигается сверху вниз на свою высоту — так снежинка пролетает секцию целиком.
        <span
          key={i}
          className="snow-column absolute top-0 h-full"
          style={{ left: `${flake.left}%`, animationDuration: `${flake.duration}s`, animationDelay: `${flake.delay}s`, ["--snow-rest" as string]: flake.rest }}
        >
          <span
            className="snow-flake block text-paper"
            style={{ opacity: flake.opacity, animationDuration: `${flake.sway}s`, animationDelay: `${flake.delay}s` }}
          >
            {flake.star ? (
              <svg viewBox="-12 -12 24 24" width={flake.size * 2.6} height={flake.size * 2.6}>
                <g stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
                  {[0, 60, 120].map((angle) => (
                    <g key={angle} transform={`rotate(${angle})`}>
                      <line y1={-10} y2={10} />
                      <path d="M-3,-7 L0,-4 L3,-7 M-3,7 L0,4 L3,7" fill="none" />
                    </g>
                  ))}
                </g>
              </svg>
            ) : (
              <span className="block rounded-full bg-paper" style={{ width: flake.size, height: flake.size, filter: "blur(0.4px)" }} />
            )}
          </span>
        </span>
      ))}
    </div>
  );
}
