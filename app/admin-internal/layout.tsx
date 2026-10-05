import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "AFFILKI — панель" },
  robots: { index: false, follow: false },
};

// В админке всё зависит от сессии и свежих данных: ничего не кэшируем и не пререндерим.
export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: LayoutProps<"/admin-internal">) {
  return <div className="min-h-dvh bg-ink">{children}</div>;
}
