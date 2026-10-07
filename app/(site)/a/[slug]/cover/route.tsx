import type { ReactNode } from "react";
import { ImageResponse } from "next/og";
import { coverVariant, posterSize } from "@/lib/article-cover";
import { getArticle } from "@/lib/data";
import { OgFlower, ogFonts } from "@/lib/og";

// Обложка-плакат статьи настоящей картинкой 1600×900 — та же композиция, что рисуется на карточках.
// Нужна, чтобы обложку можно было сохранить, скопировать и переслать.
const W = 1600;
const H = 900;
const cq = (value: number) => (value / 100) * W;

// Значки рубрик нарисованы здесь же: компоненты lucide-react — клиентские, генератор картинок их вызвать не может.
// Контуры те же, что у значков на карточках (book-open, target, newspaper, mic, layers).
// Внутри <svg> генератор принимает только обычные теги, поэтому каждый значок — массив контуров, без обёрток.
const ICONS: Record<string, ReactNode[]> = {
  articles: [
    <path key="a" d="M12 7v14" />,
    <path key="b" d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />,
  ],
  cases: [<circle key="a" cx="12" cy="12" r="10" />, <circle key="b" cx="12" cy="12" r="6" />, <circle key="c" cx="12" cy="12" r="2" />],
  news: [
    <path key="a" d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />,
    <path key="b" d="M18 14h-8" />,
    <path key="c" d="M15 18h-5" />,
    <path key="d" d="M10 6h8v4h-8V6Z" />,
  ],
  interviews: [
    <path key="a" d="M12 19v3" />,
    <path key="b" d="M19 10v2a7 7 0 0 1-14 0v-2" />,
    <rect key="c" x="9" y="2" width="6" height="13" rx="3" />,
  ],
  reviews: [
    <path key="a" d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />,
    <path key="b" d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />,
    <path key="c" d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />,
  ],
};

type Layout = {
  bg: string;
  flower: { left?: number; right?: number; top?: number; bottom?: number; width: number; rotate: number };
  align: "flex-start" | "center" | "flex-end";
  justify: "flex-start" | "center" | "flex-end";
  textAlign: "left" | "center" | "right";
};

// Те же пять композиций, что в components/articles/ArticleCover.tsx (проценты там — доли ширины и высоты).
const LAYOUTS: Layout[] = [
  { bg: "radial-gradient(ellipse at 85% 15%, #7B62F0 0%, #4A33C0 45%, #30209D 100%)", flower: { right: -0.14 * W, top: -0.38 * H, width: 0.62 * W, rotate: 10 }, align: "flex-end", justify: "flex-start", textAlign: "left" },
  { bg: "linear-gradient(118deg, #30209D 0%, #30209D 52%, #4A33C0 52%, #6C5BCE 100%)", flower: { right: -0.08 * W, bottom: -0.52 * H, width: 0.58 * W, rotate: -24 }, align: "flex-end", justify: "flex-start", textAlign: "left" },
  { bg: "radial-gradient(ellipse at 50% 55%, #7B62F0 0%, #4A33C0 50%, #2A1B8F 100%)", flower: { left: 0.18 * W, top: -0.12 * H, width: 0.64 * W, rotate: 36 }, align: "center", justify: "center", textAlign: "center" },
  { bg: "linear-gradient(200deg, #6C5BCE 0%, #4A33C0 40%, #120B3D 100%)", flower: { left: -0.2 * W, top: -0.3 * H, width: 0.56 * W, rotate: -12 }, align: "flex-end", justify: "flex-end", textAlign: "right" },
  { bg: "radial-gradient(ellipse at 12% 90%, #7B62F0 0%, #4A33C0 42%, #30209D 100%)", flower: { right: 0.06 * W, top: 0.14 * H, width: 0.4 * W, rotate: 58 }, align: "flex-start", justify: "flex-start", textAlign: "left" },
];

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const article = await getArticle((await params).slug);
  if (!article) return new Response(null, { status: 404 });

  const variant = coverVariant(article.slug);
  const layout = LAYOUTS[variant];
  const { text, size } = posterSize(article.coverText, article.title);
  const icon = ICONS[article.category.slug] ?? ICONS.articles;
  const { width, rotate, ...position } = layout.flower;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: layout.bg, color: "#FFFFFF", fontFamily: "Onest" }}>
        <div style={{ position: "absolute", display: "flex", opacity: 0.16, transform: `rotate(${rotate}deg)`, ...position }}>
          <OgFlower size={width} petal="#FFFFFF" ray="#4A33C0" rayWidth={0} />
        </div>

        <div style={{ position: "absolute", left: cq(5), top: cq(5), display: "flex", alignItems: "center", gap: cq(2) }}>
          <div style={{ width: cq(9), height: cq(9), borderRadius: cq(4.5), display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(18, 11, 61, 0.4)" }}>
            <svg viewBox="0 0 24 24" width={cq(4.6)} height={cq(4.6)} fill="none" stroke="#FFFFFF" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              {icon}
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: cq(3.6) }}>{article.category.title}</div>
        </div>

        <div
          style={{
            position: "absolute",
            // Генератор не понимает сокращение inset — размеры задаём явно.
            top: 0,
            left: 0,
            width: W,
            height: H,
            display: "flex",
            alignItems: layout.align,
            justifyContent: layout.justify,
            padding: cq(6),
            paddingTop: variant === 4 ? 0.18 * W : cq(6),
          }}
        >
          <div style={{ display: "flex", fontFamily: "Unbounded", fontSize: cq(size), lineHeight: 0.98, letterSpacing: -2, textAlign: layout.textAlign, maxWidth: cq(88) }}>
            {text}
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: await ogFonts(),
      headers: {
        "Cache-Control": "public, max-age=3600",
        // Понятное имя файла при сохранении.
        "Content-Disposition": `inline; filename="affilki-${article.slug}.png"`,
      },
    },
  );
}
