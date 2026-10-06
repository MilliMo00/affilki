import { getNominee, isVotingOpen } from "@/lib/data";
import { StoryBadge, storyImage, uploadDataUri } from "@/lib/story";

const host = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://affilki.com").replace(/^https?:\/\//, "");

/** Сторис-картинка участника: «Голосуй за …». */
export async function GET(_: Request, { params }: { params: Promise<{ nominee: string }> }) {
  const data = await getNominee((await params).nominee);
  if (!data) return new Response(null, { status: 404 });
  const { season, nomination, nominee } = data;
  const initials = nominee.name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  const voting = isVotingOpen(season, nomination);

  return storyImage({
    eyebrow: nomination.isEvents ? "Событие в номинации" : voting ? "Голосуй за" : "Участник премии",
    title: nominee.name,
    subtitle: `«${nomination.title}» — ${season.title}`,
    action: voting ? "Голосовать" : "Смотреть",
    link: `${host}/n/${nominee.slug}`,
    badge: <StoryBadge image={await uploadDataUri(nominee.logoUrl)} initials={initials} />,
  });
}
