import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReactNode } from "react";
import { PETAL_ANGLES, PETAL_PATH, RAYS, WORDMARK_LETTERS } from "@/components/brand/geometry";

// Общие части OG-картинок 1200×630 в стиле постера. Внутри next/og работает
// только flexbox и инлайн-стили, поэтому здесь нет Tailwind.
export const OG_SIZE = { width: 1200, height: 630 };

export async function ogFonts() {
  const [unbounded, onest] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Unbounded-Bold.ttf")),
    readFile(join(process.cwd(), "assets/fonts/Onest-Medium.ttf")),
  ]);
  return [
    { name: "Unbounded", data: unbounded, weight: 700 as const, style: "normal" as const },
    { name: "Onest", data: onest, weight: 500 as const, style: "normal" as const },
  ];
}

type OgFlowerProps = { size: number; petal: string; ray: string; rayWidth?: number; filled?: number };

export function OgFlower({ size, petal, ray, rayWidth = 2.6, filled = 5 }: OgFlowerProps) {
  return (
    <svg viewBox="-100 -100 200 200" width={size} height={size}>
      {PETAL_ANGLES.map((angle, i) => (
        <path
          key={angle}
          d={PETAL_PATH}
          transform={`rotate(${angle})`}
          fill={petal}
          fillOpacity={i < filled ? 1 : 0.2}
          stroke={petal}
          strokeWidth={i < filled ? 0 : 3}
        />
      ))}
      {rayWidth > 0 &&
        RAYS.map((r) => (
          <line
            key={r.angle}
            x1={0}
            y1={-r.from}
            x2={0}
            y2={-r.to}
            transform={`rotate(${r.angle})`}
            stroke={ray}
            strokeWidth={rayWidth}
            strokeLinecap="round"
          />
        ))}
      <circle r={9} fill={ray} />
      <circle r={4} fill={petal} />
    </svg>
  );
}

export function OgWordmark({ height }: { height: number }) {
  return (
    <svg viewBox="0 0 469 100" width={height * 4.69} height={height}>
      {WORDMARK_LETTERS.map((l, i) => (
        <path key={i} d={l.d} transform={`translate(${l.x})`} fill="#FFFFFF" fillRule="evenodd" />
      ))}
    </svg>
  );
}

/** Постерный фон с водяным знаком и логотипом в углу. */
export function OgFrame({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        padding: 64,
        color: "#FFFFFF",
        fontFamily: "Onest",
        background: "radial-gradient(circle at 70% 45%, #7B62F0 0%, #4A33C0 42%, #30209D 88%)",
      }}
    >
      <div style={{ position: "absolute", top: -120, left: 520, display: "flex", opacity: 0.38 }}>
        <OgFlower size={860} petal="#8F7FE6" ray="#6A57D8" rayWidth={1.1} />
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>{children}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <OgFlower size={64} petal="#FFFFFF" ray="#4A33C0" />
          <OgWordmark height={36} />
        </div>
        {footer}
      </div>
    </div>
  );
}
