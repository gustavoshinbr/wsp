import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ className, label, ...props }: InputProps) {
  return (
    <label className="block space-y-1.5 text-sm font-semibold text-racing-text">
      {label ? <span>{label}</span> : null}
      <input className={cn("h-11 rounded-lg px-3 text-sm", className)} {...props} />
    </label>
  );
}
