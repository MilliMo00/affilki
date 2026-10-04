import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Category } from "@/lib/data";

export function CategoryTabs({ categories, active }: { categories: Category[]; active?: string }) {
  const tabs = [{ href: "/articles", title: "Все", current: !active }].concat(
    categories.map((c) => ({ href: `/articles/${c.slug}`, title: c.title, current: c.slug === active })),
  );

  return (
    <nav aria-label="Рубрики" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-2 py-1">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              aria-current={tab.current ? "page" : undefined}
              className={cn(
                "flex h-11 items-center rounded-full border px-5 font-medium transition-colors",
                tab.current
                  ? "focus-on-bright border-paper bg-paper text-deep"
                  : "border-petal/60 text-text hover:border-glow hover:text-paper",
              )}
            >
              {tab.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
