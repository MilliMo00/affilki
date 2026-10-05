"use client";

import { Menu, Send } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/cn";
import { MAIN_NAV } from "@/lib/nav";
import { MobileMenu } from "./MobileMenu";

export function Header({ channelUrl }: { channelUrl: string }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
    burgerRef.current?.focus();
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors duration-200",
        scrolled ? "border-petal/40 bg-deep/75 backdrop-blur-md" : "border-transparent bg-deep",
      )}
    >
      <div className="container-page flex h-16 items-center gap-6">
        <Link href="/" aria-label="AFFILKI — на главную" className="shrink-0 rounded-sm" data-header-logo>
          <Logo size={32} rayColor="var(--deep)" />
        </Link>

        <nav aria-label="Основная навигация" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {MAIN_NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-full px-4 py-2 font-medium transition-colors hover:bg-paper/10 hover:text-paper",
                      active ? "bg-paper/10 text-paper" : "text-text",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener"
            aria-label="Telegram-канал AFFILKI"
            className="flex size-11 items-center justify-center rounded-full text-text transition-colors hover:bg-paper/10 hover:text-paper"
          >
            <Send size={20} strokeWidth={1.75} aria-hidden />
          </a>
          <button
            ref={burgerRef}
            type="button"
            aria-label="Открыть меню"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(true)}
            className="flex size-11 items-center justify-center rounded-full text-paper transition-colors hover:bg-paper/10 lg:hidden"
          >
            <Menu size={24} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>

      <MobileMenu open={menuOpen} onClose={closeMenu} channelUrl={channelUrl} pathname={pathname} />
    </header>
  );
}
