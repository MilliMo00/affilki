import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type PaginationProps = { page: number; pages: number; basePath: string };

const cell = "flex size-11 items-center justify-center rounded-full border font-medium transition-colors";

export function Pagination({ page, pages, basePath }: PaginationProps) {
  if (pages <= 1) return null;
  const href = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`);

  return (
    <nav aria-label="Страницы" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link href={href(page - 1)} aria-label="Предыдущая страница" className={cn(cell, "border-petal/60 hover:border-glow")}>
          <ChevronLeft size={20} strokeWidth={1.75} aria-hidden />
        </Link>
      )}
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-label={`Страница ${p}`}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            cell,
            p === page ? "focus-on-bright border-paper bg-paper text-deep" : "border-petal/60 text-text hover:border-glow",
          )}
        >
          {p}
        </Link>
      ))}
      {page < pages && (
        <Link href={href(page + 1)} aria-label="Следующая страница" className={cn(cell, "border-petal/60 hover:border-glow")}>
          <ChevronRight size={20} strokeWidth={1.75} aria-hidden />
        </Link>
      )}
    </nav>
  );
}
