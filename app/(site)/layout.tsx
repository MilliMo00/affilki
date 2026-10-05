import { Suspense } from "react";
import { CookieBanner } from "@/components/analytics/CookieBanner";
import { Tracker } from "@/components/analytics/Tracker";
import { VoteDialog } from "@/components/voting/VoteDialog";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Intro } from "@/components/layout/Intro";
import { TG_CHANNEL_URL } from "@/lib/env";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Intro />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-paper focus:px-4 focus:py-2 focus:text-deep"
      >
        К содержимому
      </a>
      <div className="flex min-h-dvh flex-col">
        <Header channelUrl={TG_CHANNEL_URL} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
      <VoteDialog channelUrl={TG_CHANNEL_URL} />
      {/* useSearchParams внутри трекера требует Suspense, иначе страницы нельзя пререндерить. */}
      <Suspense fallback={null}>
        <Tracker />
      </Suspense>
      <CookieBanner />
    </>
  );
}
