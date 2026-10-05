import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveGrid } from "@/components/live/LiveGrid";
import { getCurrentSeason } from "@/lib/data";
import { getLiveSnapshot } from "@/lib/live/snapshot";

export const metadata: Metadata = {
  title: "Live-табло",
  description: "Результаты голосования AFFILKI Awards в реальном времени по всем номинациям.",
};

export const dynamic = "force-dynamic";

export default async function LivePage() {
  const [season, snapshot] = await Promise.all([getCurrentSeason(), getLiveSnapshot()]);
  if (!season || !snapshot) notFound();
  return <LiveGrid initial={snapshot} title={`${season.title} — live`} />;
}
