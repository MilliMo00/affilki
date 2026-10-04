import { ImageResponse } from "next/og";
import { getArticle } from "@/lib/data";
import { OG_SIZE, OgFrame, ogFonts } from "@/lib/og";

export const alt = "Статья на AFFILKI";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const article = await getArticle((await params).slug);
  const fonts = await ogFonts();
  const title = article?.title ?? "AFFILKI";

  return new ImageResponse(
    (
      <OgFrame footer={<div style={{ display: "flex", fontSize: 28 }}>{article ? `${article.readingMin} мин чтения` : ""}</div>}>
        <div style={{ display: "flex", fontSize: 30, color: "#CFC8F5" }}>{article?.category.title ?? ""}</div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontFamily: "Unbounded",
            fontSize: title.length > 70 ? 46 : 56,
            lineHeight: 1.15,
            maxWidth: 1040,
          }}
        >
          {title}
        </div>
      </OgFrame>
    ),
    { ...size, fonts },
  );
}
