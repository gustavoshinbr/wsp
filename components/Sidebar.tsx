import Link from "next/link";
import { FileCog } from "lucide-react";
import { Logo } from "@/components/Logo";
import { navGroups } from "@/components/navigation";
import { cn } from "@/lib/utils";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <Logo compact={compact} />;
}

export function Sidebar({ pathname }: { pathname?: string }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-racing-line bg-racing-panel px-4 py-5 shadow-sm lg:block">
      <Logo />
      <nav className="mt-7 space-y-5">
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
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-racing-muted hover:bg-red-50 hover:text-racing-red dark:hover:bg-red-500/10",
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
      <div className="absolute bottom-5 left-4 right-4 rounded-lg border border-racing-line bg-racing-soft p-4">
        <div className="flex items-center gap-2 text-sm font-black">
          <FileCog size={17} className="text-racing-red" />
          Oficina isolada por workspace
        </div>
        <p className="mt-1 text-xs leading-5 text-racing-muted">
          Cada equipe acessa somente os dados da própria oficina.
        </p>
      </div>
    </aside>
  );
}
