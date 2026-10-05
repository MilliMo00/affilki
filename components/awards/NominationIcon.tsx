import {
  Award,
  Briefcase,
  Flame,
  Megaphone,
  Newspaper,
  PenTool,
  Rocket,
  Sparkles,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

// Иконка номинации хранится в базе именем lucide; неизвестное имя даёт запасную иконку.
const ICONS: Record<string, LucideIcon> = {
  users: Users,
  sparkles: Sparkles,
  "pen-tool": PenTool,
  rocket: Rocket,
  megaphone: Megaphone,
  newspaper: Newspaper,
  briefcase: Briefcase,
  "trending-up": TrendingUp,
  flame: Flame,
};

export const NOMINATION_ICON_NAMES = Object.keys(ICONS);

export function NominationIcon({ name, size = 24, className }: { name: string; size?: number; className?: string }) {
  const Icon = ICONS[name] ?? Award;
  return <Icon size={size} strokeWidth={1.75} className={className} aria-hidden />;
}
