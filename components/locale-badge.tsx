import { LocaleCompletionResult } from "@/lib/i18n";

interface LocaleBadgeProps {
  status: LocaleCompletionResult;
  showDetails?: boolean;
}

export function LocaleBadge({ status, showDetails = false }: LocaleBadgeProps) {
  const colorMap = {
    success:
      "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    warning:
      "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    destructive:
      "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
        colorMap[status.variant]
      }`}
      title={
        showDetails
          ? `${status.translatedFields} of ${status.totalFields} translatable fields localized`
          : undefined
      }
    >
      <span className="font-semibold uppercase tracking-wider">{status.locale}</span>
      <span>{status.percentage}%</span>
    </span>
  );
}
