import type { ReactNode } from "react";

/** Текстовая страница (правила, политика): типографика как у статьи. */
export function TextPage({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-prose">
        <h1 className="text-3xl sm:text-4xl">{title}</h1>
        {lead && <p className="mt-4 text-lg text-text">{lead}</p>}
        <div className="article-body mt-8">{children}</div>
      </div>
    </div>
  );
}
