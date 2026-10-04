"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { sessionActions, useSession } from "@/lib/session-store";
import { GatePanel } from "./GatePanel";

export function LoginDialog() {
  const { loginOpen, pending } = useSession();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (loginOpen && !dialog.open) dialog.showModal();
    if (!loginOpen && dialog.open) dialog.close();
  }, [loginOpen]);

  return (
    <dialog
      ref={ref}
      onClose={sessionActions.closeLogin}
      onClick={(e) => e.target === ref.current && sessionActions.closeLogin()}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-petal border border-petal bg-deep p-0 text-text backdrop:bg-ink/80"
    >
      <div className="relative p-6 pt-10 sm:p-8 sm:pt-10">
        <button
          type="button"
          aria-label="Закрыть"
          onClick={sessionActions.closeLogin}
          className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full text-muted-bright hover:bg-paper/10 hover:text-paper"
        >
          <X size={20} strokeWidth={1.75} aria-hidden />
        </button>
        <GatePanel variant="login" nomineeName={pending?.nomineeName} onLogin={sessionActions.login} />
      </div>
    </dialog>
  );
}
