import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageTitle({ title, lead, children }: { title: string; lead?: string; children?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl">{title}</h1>
        {lead && <p className="mt-1 max-w-2xl text-muted">{lead}</p>}
      </div>
      {children}
    </header>
  );
}

export function Card({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-card border border-petal/40 bg-deep/30 p-5", className)}>
      {title && <h2 className="mb-4 font-sans text-lg font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

/** Таблица админки: на узких экранах прокручивается по горизонтали. */
export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-left">
        <thead>
          <tr>
            {head.map((cell) => (
              <th key={cell} className="border-b border-petal/40 px-3 py-2 text-sm font-medium text-muted">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_td]:border-b [&_td]:border-petal/20 [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-top">{children}</tbody>
      </table>
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "good" | "warn"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border px-2.5 py-0.5 text-sm",
        tone === "good" && "border-paper/60 text-paper",
        tone === "warn" && "border-danger text-danger",
        tone === "neutral" && "border-petal/60 text-muted",
      )}
    >
      {children}
    </span>
  );
}

export function Label({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-paper">{title}</span>
      {children}
      {hint && <span className="mt-1 block text-sm text-muted">{hint}</span>}
    </label>
  );
}

export function Check({ name, title, hint, defaultChecked }: { name: string; title: string; hint?: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-start gap-3">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 size-5 shrink-0 accent-[#7B62F0]" />
      <span>
        <span className="font-medium text-paper">{title}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
    </label>
  );
}
