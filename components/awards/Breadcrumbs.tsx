import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

export function Breadcrumbs({ items }: { items: { href: string; label: string }[] }) {
  return (
    <nav aria-label="Хлебные крошки">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-muted-bright">
        {items.map((item, i) => (
          <Fragment key={item.href}>
            {i > 0 && <ChevronRight size={16} strokeWidth={1.75} aria-hidden />}
            <li>
              <Link href={item.href} className="inline-block py-1 hover:text-paper hover:underline">
                {item.label}
              </Link>
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
