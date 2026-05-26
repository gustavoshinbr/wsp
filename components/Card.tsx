import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
  value?: string | number;
};

export function Card({ className, title, value, children, ...props }: CardProps) {
  return (
    <section
      className={cn("rounded-lg border border-racing-line bg-racing-panel p-5 shadow-sm", className)}
      {...props}
    >
      {title ? <p className="text-sm font-medium text-racing-muted">{title}</p> : null}
      {value !== undefined ? <h3 className="mt-2 text-2xl font-black sm:text-3xl">{value}</h3> : null}
      {children}
    </section>
  );
}
