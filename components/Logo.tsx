import Link from "next/link";
import { Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, href = "/dashboard", className }: { compact?: boolean; href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-3", className)}>
      <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#111827] text-white shadow-sm ring-1 ring-black/10 dark:bg-zinc-950">
        <Gauge size={31} className="absolute right-1 top-1 text-racing-red" />
        <span className="relative z-10 text-sm font-black italic leading-none">WSP</span>
      </span>
      {!compact ? (
        <span className="leading-none">
          <span className="block text-xl font-black italic text-racing-text">
            WSP <span className="text-racing-red">Racing</span>
          </span>
          <span className="mt-1 block text-xs font-bold uppercase text-racing-muted">Oficina Pro</span>
        </span>
      ) : null}
    </Link>
  );
}
