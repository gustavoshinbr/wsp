"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNavItems } from "@/components/navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-nav-safe fixed bottom-0 left-0 right-0 z-40 grid grid-cols-6 border-t border-racing-line bg-racing-panel/95 px-1 pt-2 shadow-[0_-12px_35px_rgba(0,0,0,0.12)] backdrop-blur-xl lg:hidden">
      {mobileNavItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        const shortLabel =
          href === "/dashboard" ? "Início" : href === "/configuracoes" ? "Mais" : label;

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-bold text-racing-muted",
              active && "bg-red-50 text-racing-red dark:bg-red-500/10 dark:text-red-300",
            )}
          >
            <Icon size={18} />
            <span className="max-w-full truncate">{shortLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
