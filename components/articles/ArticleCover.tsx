import Image from "next/image";
import { Flower } from "@/components/brand/Flower";

type ArticleCoverProps = { slug: string; coverUrl: string | null; sizes: string; priority?: boolean };

// Позиции цветка для обложки-заглушки: выбираются по slug, чтобы лента не выглядела одинаковой.
const VARIANTS = [
  "left-[55%] top-[-30%] w-[70%]",
  "left-[-18%] top-[10%] w-[62%]",
  "left-[30%] top-[35%] w-[80%]",
  "left-[62%] top-[20%] w-[55%]",
  "left-[-10%] top-[-45%] w-[75%]",
];

export function ArticleCover({ slug, coverUrl, sizes, priority }: ArticleCoverProps) {
  if (coverUrl) {
    return <Image src={coverUrl} alt="" fill sizes={sizes} priority={priority} className="object-cover" />;
  }
  const hash = [...slug].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return (
    <div className="absolute inset-0 overflow-hidden bg-hero">
      <div className={`absolute aspect-square text-paper/20 ${VARIANTS[hash % VARIANTS.length]}`}>
        <Flower size="100%" rays={false} rayColor="var(--indigo)" />
      </div>
    </div>
  );
}
