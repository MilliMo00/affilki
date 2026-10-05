import Link from "next/link";
import { cn } from "@/lib/cn";

type TabsProps = {
  tabs: { key: string; label: string }[];
  active: string;
  /** Путь страницы; вкладка добавляется как ?tab=, чтобы ссылкой можно было делиться. */
  basePath: string;
  label: string;
};

export function Tabs({ tabs, active, basePath, label }: TabsProps) {
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto border-b border-petal px-4 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-1">
        {tabs.map((tab, i) => (
          <li key={tab.key}>
            <Link
              href={i === 0 ? basePath : `${basePath}?tab=${tab.key}`}
              scroll={false}
              aria-current={tab.key === active ? "page" : undefined}
              className={cn(
                "-mb-px flex h-12 items-center border-b-2 px-4 font-semibold transition-colors",
                tab.key === active ? "border-paper text-paper" : "border-transparent text-muted-bright hover:text-paper",
              )}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
