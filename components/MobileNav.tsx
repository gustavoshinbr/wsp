"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Gauge, MoreHorizontal, ShoppingCart, Users, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileItems = [
  { href: "/dashboard", label: "Início", icon: Gauge },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/vendas", label: "Vendas", icon: ShoppingCart },
  { href: "/producao", label: "Produção", icon: Wrench },
  { href: "/financeiro", label: "Financeiro", icon: BarChart3 },
  { href: "/configuracoes", label: "Mais", icon: MoreHorizontal },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-6 border-t border-racing-line bg-racing-panel/95 px-1 py-2 shadow-2xl backdrop-blur lg:hidden">
      {mobileItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-bold text-racing-muted",
              active && "text-racing-red",
            )}
          >
            <Icon size={18} />
            <span className="max-w-full truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
