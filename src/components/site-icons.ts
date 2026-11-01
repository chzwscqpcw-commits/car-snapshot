import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Calculator,
  CalendarCheck,
  Car,
  ClipboardCheck,
  Code,
  Fuel,
  Gauge,
  GitCompare,
  MapPin,
  PoundSterling,
  Receipt,
  Search,
  ShieldCheck,
  Wind,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * The icons a site-index entry can name (`icon: "shield-check"`). Shared by
 * the command palette and the /tools cards so both draw an entry the same way;
 * the index itself stays plain data with no React in it.
 */
export const SITE_ICONS: Record<string, LucideIcon> = {
  search: Search,
  "shield-check": ShieldCheck,
  receipt: Receipt,
  gauge: Gauge,
  wind: Wind,
  "alert-triangle": AlertTriangle,
  "pound-sterling": PoundSterling,
  "git-compare": GitCompare,
  bell: Bell,
  "calendar-check": CalendarCheck,
  "clipboard-check": ClipboardCheck,
  code: Code,
  calculator: Calculator,
  wrench: Wrench,
  "bar-chart-3": BarChart3,
  fuel: Fuel,
  "book-open": BookOpen,
  car: Car,
  "map-pin": MapPin,
  zap: Zap,
};

/** The icon for an index entry, or an arrow when it names none. */
export function siteIcon(name?: string): LucideIcon {
  return (name && SITE_ICONS[name]) || ArrowRight;
}
