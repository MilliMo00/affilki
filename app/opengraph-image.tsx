import { ImageResponse } from "next/og";
import { OG_SIZE, OgFlower, OgWordmark } from "@/lib/og";

export const alt = "AFFILKI Awards";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: "radial-gradient(circle at 50% 50%, #7B62F0 0%, #4A33C0 40%, #30209D 85%)",
        }}
      >
        <div style={{ position: "absolute", top: -150, left: 160, display: "flex", opacity: 0.4 }}>
          <OgFlower size={880} petal="#8F7FE6" ray="#6A57D8" rayWidth={1.1} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
          <OgFlower size={230} petal="#FFFFFF" ray="#4A33C0" />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
            <OgWordmark height={120} />
            <div style={{ color: "#FFFFFF", fontSize: 44, fontWeight: 600, letterSpacing: 22, marginRight: -22 }}>
              AWARDS
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
