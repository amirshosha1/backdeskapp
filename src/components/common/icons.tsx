import {
  Building,
  Building2,
  Ellipsis,
  House,
  KeyRound,
  Package,
  SprayCan,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ExpenseIcon, OperatingModel } from "@/demo/fixtures/types";

/** Fixtures name icons by meaning; the UI decides which glyph draws them. */
export const EXPENSE_ICONS: Record<ExpenseIcon, LucideIcon> = {
  rent: KeyRound,
  utilities: Zap,
  cleaning: SprayCan,
  compound: Building,
  consumables: Package,
  repairs: Wrench,
  internet: Wifi,
  other: Ellipsis,
};

export const UNIT_ICONS: Record<OperatingModel, LucideIcon> = {
  owner_operated: House,
  rental_arbitrage: KeyRound,
  managed_for_owner: Building2,
};

export function ExpenseGlyph({ icon, className = "h-5 w-5" }: { icon: ExpenseIcon; className?: string }) {
  const Icon = EXPENSE_ICONS[icon];
  return <Icon className={className} aria-hidden="true" />;
}

export function UnitGlyph({ model, className = "h-5 w-5" }: { model: OperatingModel; className?: string }) {
  const Icon = UNIT_ICONS[model];
  return <Icon className={className} aria-hidden="true" />;
}
