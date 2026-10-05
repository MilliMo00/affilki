import { LogOut } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { can, requirePermission, type Permission } from "@/lib/admin/auth";
import { adminUrl } from "@/lib/admin/path";
import { logout } from "./actions";

const NAV: { href: string; label: string; permission?: Permission }[] = [
  { href: "", label: "Обзор" },
  { href: "/submissions", label: "Заявки", permission: "content" },
  { href: "/season", label: "Сезон и защита", permission: "season" },
  { href: "/nominations", label: "Номинации и участники", permission: "awards" },
  { href: "/votes", label: "Голоса", permission: "votes" },
  { href: "/winners", label: "Победители", permission: "votes" },
  { href: "/security", label: "Безопасность", permission: "security" },
];

const ROLE_LABELS = { OWNER: "владелец", EDITOR: "редактор", ANALYST: "аналитик" } as const;

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Проверка сессии — здесь и повторно в каждой странице и каждом действии.
  const { admin } = await requirePermission();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1400px] flex-col lg:flex-row">
      <aside className="shrink-0 border-b border-petal/30 p-4 lg:w-64 lg:border-b-0 lg:border-r lg:p-6">
        <Link href={adminUrl()} className="inline-block rounded-sm">
          <Logo size={28} rayColor="var(--ink)" />
        </Link>
        <nav aria-label="Разделы панели" className="mt-4 lg:mt-8">
          <ul className="flex flex-wrap gap-1 lg:flex-col">
            {NAV.filter((item) => !item.permission || can(admin.role, item.permission)).map((item) => (
              <li key={item.href}>
                <Link href={adminUrl(item.href)} className="block rounded-card px-3 py-2 font-medium text-text hover:bg-paper/10 hover:text-paper">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-petal/30 pt-4 lg:mt-8">
          <p className="min-w-0 text-sm">
            <span className="block truncate font-medium text-paper">{admin.name}</span>
            <span className="text-muted">{ROLE_LABELS[admin.role]}</span>
          </p>
          <form action={logout}>
            <button type="submit" aria-label="Выйти" title="Выйти" className="flex size-11 items-center justify-center rounded-full text-text hover:bg-paper/10 hover:text-paper">
              <LogOut size={20} strokeWidth={1.75} aria-hidden />
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
