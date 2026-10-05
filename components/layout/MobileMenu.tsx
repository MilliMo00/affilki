"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Send, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Logo } from "@/components/brand/Logo";
import { Watermark } from "@/components/brand/Watermark";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { MAIN_NAV } from "@/lib/nav";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  channelUrl: string;
  pathname: string;
};

export function MobileMenu({ open, onClose, channelUrl, pathname }: MobileMenuProps) {
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !panel) return;
      // Фокус не уходит под меню.
      const items = panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Меню"
          className="fixed inset-0 z-50 flex h-dvh flex-col overflow-hidden bg-deep lg:hidden"
          initial={reduced ? { opacity: 0 } : { x: "100%" }}
          animate={reduced ? { opacity: 1 } : { x: 0 }}
          exit={reduced ? { opacity: 0 } : { x: "100%" }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <Watermark className="top-auto bottom-0 translate-y-[38%] opacity-30" />

          <div className="container-page relative flex h-16 shrink-0 items-center justify-between">
            <Logo size={32} rayColor="var(--deep)" />
            <button
              type="button"
              data-autofocus
              aria-label="Закрыть меню"
              onClick={onClose}
              className="-mr-2 flex size-11 items-center justify-center rounded-full text-paper hover:bg-paper/10"
            >
              <X size={24} strokeWidth={1.75} aria-hidden />
            </button>
          </div>

          <nav aria-label="Основная навигация" className="container-page relative flex-1 overflow-y-auto pt-6">
            <ul className="flex flex-col gap-1">
              {MAIN_NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block rounded-card py-3 font-display text-2xl font-bold",
                        active ? "text-paper" : "text-text hover:text-paper",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="container-page relative flex shrink-0 flex-col gap-3 pb-8">
            <Button href={channelUrl} variant="secondary">
              <Send size={18} strokeWidth={1.75} aria-hidden />
              Канал AFFILKI
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
