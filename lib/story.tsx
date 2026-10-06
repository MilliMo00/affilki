import { ImageResponse } from "next/og";
import type { ReactNode } from "react";
import { OgFlower, OgWordmark, ogFonts } from "@/lib/og";
import { readUpload } from "@/lib/storage";

// Картинка для сторис 1080×1920 в стиле постера. Её человек отправляет в Instagram или Telegram,
// а ссылку добавляет стикером: вставить кликабельную кнопку в чужую сторис с сайта нельзя.
export const STORY_SIZE = { width: 1080, height: 1920 };

/** Загруженная картинка как data-URI: генератору не нужно ходить за ней по сети. */
export async function uploadDataUri(url: string | null) {
  const name = url?.startsWith("/uploads/") ? url.slice("/uploads/".length) : null;
  const file = name ? await readUpload(name) : null;
  return file ? `data:${file.mime};base64,${file.bytes.toString("base64")}` : null;
}

type StoryProps = {
  /** Маленькая строка над заголовком: «Голосуй за», «Номинация», рубрика. */
  eyebrow: string;
  title: string;
  /** Строка под заголовком. */
  subtitle?: string;
  /** Надпись на кнопке внизу. */
  action: string;
  /** Адрес без https:// — печатается под кнопкой. */
  link: string;
  /** Круглая картинка или инициалы над заголовком. */
  badge?: ReactNode;
};

export async function storyImage({ eyebrow, title, subtitle, action, link, badge }: StoryProps) {
  const size = title.length > 60 ? 64 : title.length > 34 ? 80 : title.length > 18 ? 96 : 120;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          padding: "130px 80px 150px",
          color: "#FFFFFF",
          fontFamily: "Onest",
          textAlign: "center",
          background: "radial-gradient(circle at 50% 42%, #7B62F0 0%, #4A33C0 45%, #30209D 90%)",
        }}
      >
        <div style={{ position: "absolute", top: 180, left: -260, display: "flex", opacity: 0.34 }}>
          <OgFlower size={1600} petal="#8F7FE6" ray="#6A57D8" rayWidth={1.1} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <OgFlower size={92} petal="#FFFFFF" ray="#4A33C0" />
            <OgWordmark height={52} />
          </div>
          <div style={{ display: "flex", fontSize: 30, letterSpacing: 14, marginRight: -14 }}>AWARDS</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 36, maxWidth: 920 }}>
          {badge}
          <div style={{ display: "flex", fontSize: 44, color: "#E9E5FF" }}>{eyebrow}</div>
          <div style={{ display: "flex", fontFamily: "Unbounded", fontSize: size, lineHeight: 1.08 }}>{title}</div>
          {subtitle && <div style={{ display: "flex", fontSize: 44, lineHeight: 1.3, color: "#E9E5FF" }}>{subtitle}</div>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "34px 84px",
              borderRadius: 80,
              background: "#FFFFFF",
              color: "#30209D",
              fontFamily: "Unbounded",
              fontSize: 50,
            }}
          >
            {action}
          </div>
          <div style={{ display: "flex", fontSize: 38, color: "#E9E5FF" }}>{link}</div>
        </div>
      </div>
    ),
    { ...STORY_SIZE, fonts: await ogFonts(), headers: { "Cache-Control": "public, max-age=300" } },
  );
}

/** Круглый значок: логотип или инициалы. */
export function StoryBadge({ image, initials }: { image: string | null; initials: string }) {
  const base = { width: 300, height: 300, borderRadius: 150, border: "8px solid #FFFFFF", display: "flex" as const };
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element -- это разметка генератора картинок, а не страница
    <img src={image} alt="" width={300} height={300} style={{ ...base, objectFit: "cover" }} />
  ) : (
    <div style={{ ...base, alignItems: "center", justifyContent: "center", background: "#120B3D", fontFamily: "Unbounded", fontSize: 104 }}>
      {initials}
    </div>
  );
}
