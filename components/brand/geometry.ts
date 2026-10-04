// Геометрия цветка в системе координат viewBox="-100 -100 200 200".
// Один лепесток смотрит вверх, остальные — поворотом на 72°.
export const FLOWER_VIEWBOX = "-100 -100 200 200";

export const PETAL_PATH =
  "M0,-6 C-13,-20 -38,-40 -38,-64 C-38,-88 -10,-90 0,-99 C10,-90 38,-88 38,-64 C38,-40 13,-20 0,-6 Z";

export const PETAL_ANGLES = [0, 72, 144, 216, 288] as const;

// 20 лучей: длинные идут по оси лепестка, короткие — в стык между лепестками.
export const RAYS = Array.from({ length: 20 }, (_, i) => {
  const length = i % 4 === 0 ? 46 : i % 4 === 2 ? 28 : 36;
  return { angle: i * 18, from: 11, to: length };
});

// Вордмарк AFFILKI: буквы отдельными контурами (кап-высота 100), чтобы интро
// могло проявлять их по одной. viewBox="0 0 469 100".
export const WORDMARK_VIEWBOX = "0 0 469 100";

export const WORDMARK_LETTERS = [
  { char: "A", x: 0, d: "M0,100 L37,0 L59,0 L96,100 L72,100 L66,81 L30,81 L24,100 Z M48,24 L60,62 L36,62 Z" },
  { char: "F", x: 104, d: "M0,0 H62 V20 H23 V42 H56 V61 H23 V100 H0 Z" },
  { char: "F", x: 176, d: "M0,0 H62 V20 H23 V42 H56 V61 H23 V100 H0 Z" },
  { char: "I", x: 248, d: "M0,0 H23 V100 H0 Z" },
  { char: "L", x: 281, d: "M0,0 H23 V80 H60 V100 H0 Z" },
  { char: "K", x: 349, d: "M0,0 H23 V42 L58,0 H86 L48,44 L89,100 H61 L32,61 L23,71 V100 H0 Z" },
  { char: "I", x: 446, d: "M0,0 H23 V100 H0 Z" },
] as const;
