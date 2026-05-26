import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "red" | "green" | "amber" | "zinc";
};

export function Badge({ className, tone = "zinc", ...props }: BadgeProps) {
  const tones = {
    red: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30",
    green:
      "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
    amber:
      "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
    zinc: "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700",
  };

  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1", tones[tone], className)}
      {...props}
    />
  );
}
