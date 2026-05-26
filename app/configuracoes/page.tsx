import Link from "next/link";
import { Building2, CreditCard, KeyRound, LogOut, Moon, ReceiptText, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { requirePageUser } from "@/lib/auth";
import { subscriptionMessage } from "@/lib/subscription";

export default async function ConfiguracoesPage({ searchParams }: { searchParams: { error?: string; success?: string } }) {
  const user = await requirePageUser({ allowExpiredSubscription: true });

  return (
    <AppShell allowExpiredSubscription>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-black">Configurações</h1>
          <p className="text-sm text-racing-muted">Perfil da oficina, assinatura, tema e segurança.</p>
        </div>
        {searchParams.error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{searchParams.error}</div> : null}
        {searchParams.success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">Senha atualizada.</div> : null}

        <Card>
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-black text-sm font-black italic text-white">WSP</span>
            <div>
              <h2 className="text-xl font-black">{user.workspace.workshopName}</h2>
              <p className="text-sm text-racing-muted">{user.email}</p>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h2 className="flex items-center gap-2 font-black">
              <Building2 size={18} />
              Dados da empresa
            </h2>
            <div className="mt-3 space-y-1 text-sm text-racing-muted">
              <p>Responsável: {user.workspace.ownerName}</p>
              <p>Documento: {user.workspace.document}</p>
              <p>Telefone: {user.workspace.phone || "-"}</p>
            </div>
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 font-black">
              <ShieldCheck size={18} />
              Assinatura
            </h2>
            <p className="mt-3 text-sm text-racing-muted">{subscriptionMessage(user.workspace)}</p>
            <Link href="/assinatura" className="mt-4 inline-flex text-sm font-black text-racing-red">Gerenciar assinatura</Link>
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 font-black">
              <KeyRound size={18} />
              Alterar senha
            </h2>
            <form action="/api/auth/change-password" method="post" className="mt-4 space-y-3">
              <input name="currentPassword" type="password" required className="h-11 rounded-lg px-3" placeholder="Senha atual" />
              <input name="newPassword" type="password" minLength={8} required className="h-11 rounded-lg px-3" placeholder="Nova senha" />
              <input name="confirmPassword" type="password" minLength={8} required className="h-11 rounded-lg px-3" placeholder="Confirmar senha" />
              <Button type="submit" className="w-full">Salvar senha</Button>
            </form>
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 font-black">
              <Moon size={18} />
              Tema
            </h2>
            <div className="mt-4">
              <ThemeToggle />
            </div>
            <Link href="/fiscal" className="mt-6 flex items-center gap-2 text-sm font-black text-racing-red">
              <ReceiptText size={16} />
              Dados fiscais
            </Link>
            <Link href="/assinatura" className="mt-3 flex items-center gap-2 text-sm font-black text-racing-red">
              <CreditCard size={16} />
              Plano e checkout
            </Link>
            <form action="/api/auth/logout" method="post" className="mt-6">
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-racing-line px-4 py-2 text-sm font-bold">
                <LogOut size={17} />
                Sair
              </button>
            </form>
          </Card>
        </div>
        <p className="text-center text-xs text-racing-muted">Versão 2.0.0</p>
      </div>
    </AppShell>
  );
}
