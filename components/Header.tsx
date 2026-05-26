import { LogOut, Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/Badge";
import { MobileMenuButton } from "@/components/MobileMenuButton";
import { subscriptionMessage } from "@/lib/subscription";
import type { Workspace } from "@prisma/client";

export function Header({
  workshopName,
  ownerName,
  workspace,
}: {
  workshopName: string;
  ownerName: string;
  workspace: Pick<Workspace, "trialEndsAt" | "subscriptionStatus">;
}) {
  const active = workspace.subscriptionStatus === "ACTIVE";

  return (
    <header className="mb-6 flex flex-col gap-3 rounded-lg border border-racing-line bg-racing-panel p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <MobileMenuButton />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-racing-muted">Olá, {ownerName}</p>
          <h1 className="truncate text-xl font-black">{workshopName}</h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={active ? "green" : "amber"}>
          <ShieldCheck size={14} className="mr-1" />
          {subscriptionMessage(workspace)}
        </Badge>
        <ThemeToggle />
        <Link
          href="/vendas"
          className="hidden min-h-10 items-center justify-center gap-2 rounded-lg bg-racing-red px-4 py-2 text-sm font-bold text-white hover:bg-red-700 sm:inline-flex"
        >
          <Plus size={17} />
          Nova venda
        </Link>
        <form action="/api/auth/logout" method="post">
          <Button variant="outline" type="submit" title="Sair" className="h-10 min-h-10 px-3">
            <LogOut size={17} />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
