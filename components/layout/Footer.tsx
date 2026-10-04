import { Send } from "lucide-react";
import Link from "next/link";
import { Flower } from "@/components/brand/Flower";
import { Logo } from "@/components/brand/Logo";
import { ADS_CONTACT_URL, TG_CHANNEL_URL } from "@/lib/env";
import { DEFAULT_CATEGORIES } from "@/lib/nav";

const COLUMNS = [
  {
    title: "Премия",
    links: [
      { href: "/awards", label: "Текущий сезон" },
      { href: "/awards#archive", label: "Архив" },
      { href: "/rules", label: "Правила голосования" },
    ],
  },
  {
    title: "Статьи",
    links: DEFAULT_CATEGORIES.map((c) => ({ href: `/articles/${c.slug}`, label: c.title })),
  },
  {
    title: "AFFILKI",
    links: [
      { href: "/ads", label: "Реклама" },
      { href: "/submit", label: "Предложить статью" },
      { href: "/privacy", label: "Политика конфиденциальности" },
    ],
  },
];

export function Footer() {
  const contactHandle = `@${ADS_CONTACT_URL.split("/").pop()}`;

  return (
    <footer className="border-t border-petal/30 bg-ink">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.3fr]">
        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="mb-4 font-sans text-base font-semibold text-paper">{column.title}</h2>
            <ul className="space-y-1">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-block py-1.5 text-muted hover:text-paper">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="mb-4 font-sans text-base font-semibold text-paper">Контакты</h2>
          <a
            href={ADS_CONTACT_URL}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-3 rounded-card border border-petal/40 p-3 hover:border-glow"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-indigo">
              <Flower size={28} className="text-paper" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold text-paper">{contactHandle}</span>
              <span className="block text-sm text-muted">Реклама и сотрудничество</span>
            </span>
          </a>
        </div>
      </div>

      <div className="border-t border-petal/20">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-6">
          <Logo size={24} rayColor="var(--ink)" />
          <p className="text-sm text-muted">© AFFILKI 2024–{new Date().getFullYear()}</p>
          <a
            href={TG_CHANNEL_URL}
            target="_blank"
            rel="noopener"
            aria-label="Telegram-канал AFFILKI"
            className="flex size-11 items-center justify-center rounded-full text-muted hover:bg-paper/10 hover:text-paper"
          >
            <Send size={20} strokeWidth={1.75} aria-hidden />
          </a>
        </div>
      </div>
    </footer>
  );
}
