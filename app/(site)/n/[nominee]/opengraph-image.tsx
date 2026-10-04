import { ImageResponse } from "next/og";
import { getNominee } from "@/lib/data";
import { OG_SIZE, OgFlower, OgFrame, ogFonts } from "@/lib/og";
import { STAGE_LABELS, stageNumber } from "@/lib/stages";

export const alt = "Участник AFFILKI Awards";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ nominee: string }> }) {
  const data = await getNominee((await params).nominee);
  const fonts = await ogFonts();

  if (!data) {
    return new ImageResponse(<OgFrame>AFFILKI Awards</OgFrame>, { ...size, fonts });
  }

  const { season, nomination, nominee } = data;
  const initials = nominee.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return new ImageResponse(
    (
      <OgFrame
        footer={
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28 }}>
            <OgFlower size={56} petal="#FFFFFF" ray="#4A33C0" rayWidth={0} filled={stageNumber(season.stage)} />
            {STAGE_LABELS[season.stage]}
          </div>
        }
      >
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <div
            style={{
              width: 168,
              height: 168,
              borderRadius: 84,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#120B3D",
              border: "4px solid #6C5BCE",
              fontFamily: "Unbounded",
              fontSize: 60,
            }}
          >
            {initials}
          </div>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 820 }}>
            <div style={{ fontFamily: "Unbounded", fontSize: nominee.name.length > 14 ? 64 : 84, lineHeight: 1.05 }}>
              {nominee.name}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 44, fontSize: 40, lineHeight: 1.3, maxWidth: 900 }}>
          в номинации «{nomination.title}» — {season.title}
        </div>
      </OgFrame>
    ),
    { ...size, fonts },
  );
}
