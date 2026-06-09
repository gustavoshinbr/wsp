import { BookOpen, LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileMenuButton } from "@/components/MobileMenuButton";
import { SubscriptionStatusBadge } from "@/components/SubscriptionStatusBadge";
import type { Workspace } from "@prisma/client";

export function Header({
  workshopName,
  userName,
  workspace,
}: {
  workshopName: string;
  userName: string;
  workspace: Pick<Workspace, "trialEndsAt" | "subscriptionStatus" | "subscriptionCurrentPeriodEnd">;
}) {
  return (
    <header className="mb-6 flex flex-col gap-3 rounded-2xl border border-racing-line bg-racing-panel p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <MobileMenuButton />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-racing-muted">Olá, {userName}</p>
          <h1 className="truncate text-xl font-black">{workshopName}</h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SubscriptionStatusBadge
          status={workspace.subscriptionStatus}
          trialEndsAt={workspace.trialEndsAt.toISOString()}
          subscriptionCurrentPeriodEnd={workspace.subscriptionCurrentPeriodEnd?.toISOString()}
        />
        <ThemeToggle />
        <a
          href="/docs/manual-wsp-racing.pdf"
          target="_blank"
          rel="noreferrer"
          title="Abrir manual do sistema"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-racing-line bg-racing-panel px-3 py-2 text-sm font-bold text-racing-muted hover:bg-racing-soft hover:text-racing-text"
        >
          <BookOpen size={17} />
          <span className="hidden xl:inline">Manual</span>
        </a>
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
