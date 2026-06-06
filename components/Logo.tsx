import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, href = "/dashboard", className }: { compact?: boolean; href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-3", className)}>
      <Image
        src="/icons/wsp-app-icon-48.png"
        alt=""
        width={48}
        height={48}
        priority
        className="h-12 w-12 shrink-0 rounded-xl shadow-sm ring-1 ring-black/10"
      />
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
