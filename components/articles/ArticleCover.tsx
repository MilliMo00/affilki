import { BookOpen, Layers, Mic, Newspaper, Target, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { Flower } from "@/components/brand/Flower";
import { PetalIcon } from "@/components/brand/PetalIcon";
import { coverVariant, posterSize } from "@/lib/article-cover";
import { cn } from "@/lib/cn";

type ArticleCoverProps = {
  slug: string;
  title: string;
  category: { slug: string; title: string };
  coverUrl: string | null;
  /** Крупный текст плаката; без него берётся начало заголовка. */
  coverText: string | null;
  sizes: string;
  priority?: boolean;
  /** Показать плакат настоящей картинкой (PNG) — её можно сохранить и скопировать. Для страницы статьи. */
  asImage?: boolean;
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  articles: BookOpen,
  cases: Target,
  news: Newspaper,
  interviews: Mic,
  reviews: Layers,
};

// Пять композиций плаката. Выбираются по адресу статьи: у соседних карточек они разные,
// а у одной и той же статьи — всегда одна.
const LAYOUTS = [
  { bg: "radial-gradient(ellipse at 85% 15%, #7B62F0 0%, #4A33C0 45%, #30209D 100%)", flower: "right-[-14%] top-[-38%] w-[62%] rotate-[10deg]", text: "items-end justify-start text-left" },
  { bg: "linear-gradient(118deg, #30209D 0%, #30209D 52%, #4A33C0 52%, #6C5BCE 100%)", flower: "right-[-8%] bottom-[-52%] w-[58%] rotate-[-24deg]", text: "items-end justify-start text-left" },
  { bg: "radial-gradient(ellipse at 50% 55%, #7B62F0 0%, #4A33C0 50%, #2A1B8F 100%)", flower: "left-[18%] top-[-12%] w-[64%] rotate-[36deg]", text: "items-center justify-center text-center" },
  { bg: "linear-gradient(200deg, #6C5BCE 0%, #4A33C0 40%, #120B3D 100%)", flower: "left-[-20%] top-[-30%] w-[56%] rotate-[-12deg]", text: "items-end justify-end text-right" },
  { bg: "radial-gradient(ellipse at 12% 90%, #7B62F0 0%, #4A33C0 42%, #30209D 100%)", flower: "right-[6%] top-[14%] w-[40%] rotate-[58deg]", text: "items-start justify-start text-left pt-[18%]" },
];

/**
 * Обложка статьи. Есть картинка — показываем её; нет — типографический плакат:
 * рубрика, крупное слово и цветок. Размеры заданы в долях ширины контейнера (cqw),
 * поэтому плакат одинаково выглядит и на карточке, и в шапке статьи.
 */
export function ArticleCover({ slug, title, category, coverUrl, coverText, sizes, priority, asImage }: ArticleCoverProps) {
  if (coverUrl) {
    return <Image src={coverUrl} alt="" fill sizes={sizes} priority={priority} className="object-cover" />;
  }
  if (asImage) {
    // unoptimized: отдаём ровно тот файл, который человек сохранит.
    return <Image src={`/a/${slug}/cover`} alt={`Обложка: ${title}`} fill unoptimized sizes={sizes} priority={priority} className="object-cover" />;
  }

  const layout = LAYOUTS[coverVariant(slug)];
  const { text, size } = posterSize(coverText, title);
  const Icon = CATEGORY_ICONS[category.slug] ?? BookOpen;

  return (
    <div aria-hidden className="grain absolute inset-0 overflow-hidden" style={{ background: layout.bg, containerType: "inline-size" }}>
      <div className={cn("absolute aspect-square text-paper/[0.16]", layout.flower)}>
        <Flower size="100%" rays={false} rayColor="var(--indigo)" />
      </div>

      <div className="absolute left-[5cqw] top-[5cqw] flex items-center gap-[2cqw]">
        <span className="flex size-[9cqw] items-center justify-center rounded-full bg-ink/40 text-paper">
          <Icon style={{ width: "4.6cqw", height: "4.6cqw" }} strokeWidth={1.75} />
        </span>
        <span className="font-sans font-semibold text-paper" style={{ fontSize: "3.6cqw" }}>
          {category.title}
        </span>
      </div>

      <PetalIcon size={16} filled className="absolute right-[5cqw] top-[5.5cqw] h-[5cqw] w-auto text-paper/70" />

      <div className={cn("absolute inset-0 flex p-[6cqw]", layout.text)}>
        <span className="font-display font-extrabold leading-[0.95] tracking-tight text-paper" style={{ fontSize: `${size}cqw` }}>
          {text}
        </span>
      </div>
    </div>
  );
}
