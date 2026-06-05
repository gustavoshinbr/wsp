import Link from "next/link";
import { LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/Button";
import { Logo } from "@/components/Logo";
import { redirectIfAuthenticated } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const query = await searchParams;
  await redirectIfAuthenticated();

  return (
    <main className="grid min-h-screen bg-racing-bg text-racing-text lg:grid-cols-[1fr_1.1fr]">
      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Logo href="/login" className="justify-center" />
            <h1 className="mt-6 text-2xl font-black">Bem-vindo de volta</h1>
            <p className="mt-1 text-sm text-racing-muted">Entre para continuar gerenciando sua oficina.</p>
          </div>

          {query.error ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {query.error}
            </div>
          ) : null}

          <form action="/api/auth/login" method="post" className="space-y-4 rounded-lg border border-racing-line bg-racing-panel p-5 shadow-sm">
            <input type="hidden" name="next" value={query.next || ""} />
            <label className="block space-y-1.5 text-sm font-bold">
              Email
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-racing-muted" size={17} />
                <input name="email" type="email" autoComplete="email" required className="h-11 rounded-lg pl-10 pr-3" placeholder="oficina@email.com" />
              </span>
            </label>
            <label className="block space-y-1.5 text-sm font-bold">
              Senha
              <span className="relative block">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-racing-muted" size={17} />
                <input name="password" type="password" autoComplete="current-password" required className="h-11 rounded-lg pl-10 pr-3" placeholder="Sua senha" />
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-racing-muted">
              <input name="remember" type="checkbox" className="h-4 w-4 rounded" />
              Manter conectado
            </label>
            <Button type="submit" className="w-full">Entrar</Button>
          </form>

          <p className="mt-5 text-center text-sm text-racing-muted">
            Ainda não tem conta?{" "}
            <Link href="/register" className="font-black text-racing-red hover:underline">
              Criar conta real
            </Link>
          </p>
        </div>
      </section>

      <section className="hidden bg-[#111827] p-8 text-white lg:flex lg:items-end">
        <div className="max-w-xl">
          <p className="text-sm font-black uppercase text-red-300">WSP Racing Pro</p>
          <h2 className="mt-3 text-5xl font-black leading-tight">Gestão premium para oficinas de motos.</h2>
          <p className="mt-5 text-lg text-zinc-300">
            Clientes, motos, estoque com fotos, orçamentos, agenda, vendas e relatórios com assinatura recorrente Asaas.
          </p>
        </div>
      </section>
    </main>
  );
}
