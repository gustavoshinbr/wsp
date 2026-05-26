"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { navGroups } from "@/components/navigation";
import { cn } from "@/lib/utils";

export function MobileMenuButton() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-racing-soft text-racing-muted lg:hidden"
      >
        <Menu size={19} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/45"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-[min(84vw,22rem)] flex-col overflow-y-auto border-r border-racing-line bg-racing-panel px-4 py-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <Logo />
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-lg border border-racing-line text-racing-muted"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="mt-6 space-y-5">
              {navGroups.map((group) => (
                <div key={group.title}>
                  <p className="mb-2 px-3 text-[11px] font-black uppercase text-racing-muted">
                    {group.title}
                  </p>
                  <div className="space-y-1">
                    {group.items.map(({ href, label, icon: Icon }) => {
                      const active = pathname === href;
                      return (
                        <Link
                          key={href}
                          href={href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold text-racing-muted",
                            active && "bg-red-50 text-racing-red dark:bg-red-500/10",
                          )}
                        >
                          <Icon size={18} />
                          {label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}
    </>
  );
}
