import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { Sidebar } from "@/components/Sidebar";
import { requirePageUser } from "@/lib/auth";

export async function AppShell({
  children,
  allowExpiredSubscription = false,
}: {
  children: React.ReactNode;
  allowExpiredSubscription?: boolean;
}) {
  const user = await requirePageUser({ allowExpiredSubscription });

  return (
    <div className="flex min-h-screen bg-racing-bg text-racing-text">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 py-4 pb-24 sm:px-6 lg:px-8 lg:py-6">
        <Header
          workshopName={user.workspace.workshopName}
          ownerName={user.workspace.ownerName}
          workspace={user.workspace}
        />
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
