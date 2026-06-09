"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { navGroups } from "@/components/navigation";
import { cn } from "@/lib/utils";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <Logo compact={compact} />;
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-racing-line bg-racing-panel px-4 py-5 shadow-sm lg:flex">
      <div className="px-2">
        <Logo />
      </div>
      <nav className="wsp-scrollbar mt-7 min-h-0 flex-1 space-y-5 overflow-y-auto pr-2">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-[11px] font-black uppercase text-racing-muted">{group.title}</p>
            <div className="space-y-1">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-racing-muted hover:bg-racing-soft hover:text-racing-text",
                      active && "bg-red-50 text-racing-red shadow-sm dark:bg-red-500/10 dark:text-red-300",
                    )}
                  >
                    <Icon size={18} className="transition-transform group-hover:scale-105" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
