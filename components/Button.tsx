import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const variants = {
    primary: "bg-racing-red text-white hover:bg-red-700",
    secondary: "bg-racing-soft text-racing-text hover:bg-racing-line/70",
    outline: "border border-racing-line bg-racing-panel text-racing-text hover:bg-racing-soft",
    danger: "bg-zinc-900 text-white hover:bg-red-700 dark:bg-red-600",
    ghost: "text-racing-muted hover:bg-racing-soft hover:text-racing-text",
  };

  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
