import { AppShell } from "@/components/AppShell";

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
