"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { sessionActions, useSession } from "@/lib/session-store";

/** «Войти» или аватар с меню «Мои голоса / Выйти». */
export function UserMenu({ className }: { className?: string }) {
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <Button size="sm" className={className} onClick={() => sessionActions.openLogin()}>
        Войти
      </Button>
    );
  }

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        aria-label={`Меню пользователя ${user.name}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="focus-on-bright flex size-10 items-center justify-center rounded-full bg-paper font-semibold text-deep"
      >
        {user.name[0]}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-card border border-petal bg-deep py-1"
        >
          <p className="truncate px-4 py-2 text-sm text-muted-bright">@{user.username}</p>
          <Link
            role="menuitem"
            href="/awards"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-text hover:bg-paper/10 hover:text-paper"
          >
            Мои голоса
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              sessionActions.logout();
            }}
            className="block w-full px-4 py-2.5 text-left text-text hover:bg-paper/10 hover:text-paper"
          >
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
