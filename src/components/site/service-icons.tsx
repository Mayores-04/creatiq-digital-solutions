import { BadgeCheck, Brush, Code2, LayoutDashboard, PenTool, Share2, Smartphone, Video, type LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = { BadgeCheck, Brush, Code2, LayoutDashboard, PenTool, Share2, Smartphone, Video };

export function getServiceIcon(name: string): LucideIcon {
  return iconMap[name] ?? Code2;
}
