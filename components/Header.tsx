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

      <div className="grid w-full grid-cols-3 items-center gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
        <SubscriptionStatusBadge
          status={workspace.subscriptionStatus}
          trialEndsAt={workspace.trialEndsAt.toISOString()}
          subscriptionCurrentPeriodEnd={workspace.subscriptionCurrentPeriodEnd?.toISOString()}
          className="col-span-3 min-h-9 justify-center sm:col-auto"
        />
        <ThemeToggle className="w-full px-2 sm:w-auto sm:px-3" showLabelOnMobile />
        <a
          href="/docs/manual-wsp-racing.pdf"
          target="_blank"
          rel="noreferrer"
          title="Abrir manual do sistema"
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-racing-line bg-racing-panel px-2 py-2 text-sm font-bold text-racing-muted hover:bg-racing-soft hover:text-racing-text sm:w-auto sm:px-3"
        >
          <BookOpen size={17} />
          <span className="sm:hidden xl:inline">Manual</span>
        </a>
        <Link
          href="/vendas"
          className="hidden min-h-10 items-center justify-center gap-2 rounded-lg bg-racing-red px-4 py-2 text-sm font-bold text-white hover:bg-red-700 sm:inline-flex"
        >
          <Plus size={17} />
          Nova venda
        </Link>
        <form action="/api/auth/logout" method="post" className="w-full sm:w-auto">
          <Button variant="outline" type="submit" title="Sair" className="h-10 min-h-10 w-full px-2 sm:w-auto sm:px-3">
            <LogOut size={17} />
            <span>Sair</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
