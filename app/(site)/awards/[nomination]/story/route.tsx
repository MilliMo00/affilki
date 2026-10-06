import { getNomination, isVotingOpen } from "@/lib/data";
import { plural } from "@/lib/format";
import { storyImage } from "@/lib/story";

const host = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://affilki.com").replace(/^https?:\/\//, "");

/** Сторис-картинка номинации. */
export async function GET(_: Request, { params }: { params: Promise<{ nomination: string }> }) {
  const data = await getNomination((await params).nomination);
  if (!data) return new Response(null, { status: 404 });
  const { season, nomination } = data;
  const count = nomination.nominees.length;
  const noun: [string, string, string] = nomination.isEvents ? ["событие", "события", "событий"] : ["участник", "участника", "участников"];

  return storyImage({
    eyebrow: `Номинация ${nomination.number} из ${season.nominations.length}`,
    title: nomination.title,
    subtitle: `${count} ${plural(count, noun)} · ${season.title}`,
    action: isVotingOpen(season, nomination) ? "Голосовать" : "Смотреть участников",
    link: `${host}/awards/${nomination.slug}`,
  });
}
