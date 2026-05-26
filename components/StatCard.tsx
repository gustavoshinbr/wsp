import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/Card";
import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  helper,
  icon: Icon,
  tone = "red",
}: {
  title: string;
  value: string | number;
  helper?: string;
  icon?: LucideIcon;
  tone?: "red" | "green" | "amber" | "zinc";
}) {
  const tones = {
    red: "bg-red-50 text-racing-red dark:bg-red-500/10 dark:text-red-300",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
    zinc: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
  };

  return (
    <Card className="min-h-32">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-racing-muted">{title}</p>
          <strong className="mt-2 block text-2xl font-black sm:text-3xl">{value}</strong>
        </div>
        {Icon ? (
          <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full", tones[tone])}>
            <Icon size={20} />
          </span>
        ) : null}
      </div>
      {helper ? <p className="mt-3 text-xs font-medium text-racing-muted">{helper}</p> : null}
    </Card>
  );
}
