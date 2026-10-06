import { getArticle } from "@/lib/data";
import { storyImage } from "@/lib/story";

const host = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://affilki.com").replace(/^https?:\/\//, "");

/** Сторис-картинка статьи. */
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const article = await getArticle((await params).slug);
  if (!article) return new Response(null, { status: 404 });

  return storyImage({
    eyebrow: article.category.title,
    title: article.title,
    subtitle: `${article.readingMin} мин чтения`,
    action: "Читать",
    link: `${host}/a/${article.slug}`,
  });
}
