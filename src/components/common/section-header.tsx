import { Link } from "@/i18n/navigation";
import { ToastButton } from "./toast";

export interface SectionHeaderProps {
  title: string;
  action?: { label: string; href?: string; comingSoon?: string };
  as?: "h2" | "h3";
}

/** Section title with an optional action in brand blue, so it reads as tappable. */
export function SectionHeader({ title, action, as: Heading = "h2" }: SectionHeaderProps) {
  const actionClass = "tap -me-2 rounded-full px-2 py-1 text-sm font-medium text-brand";
  return (
    <div className="flex items-baseline justify-between gap-2">
      <Heading className="text-lg font-semibold">{title}</Heading>
      {action?.href && (
        <Link href={action.href} className={actionClass}>
          {action.label}
        </Link>
      )}
      {action && !action.href && action.comingSoon && (
        <ToastButton message={action.comingSoon} className={actionClass}>
          {action.label}
        </ToastButton>
      )}
    </div>
  );
}
