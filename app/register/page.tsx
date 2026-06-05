import Link from "next/link";
import { Button } from "@/components/Button";
import { Logo } from "@/components/Logo";
import { redirectIfAuthenticated } from "@/lib/auth";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  await redirectIfAuthenticated();

  return (
    <main className="min-h-screen bg-racing-bg px-4 py-8 text-racing-text">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-lg border border-racing-line bg-racing-panel p-6 shadow-sm lg:p-8">
          <Logo href="/register" />
          <h1 className="mt-8 text-3xl font-black">Crie sua conta oficial</h1>
          <p className="mt-3 text-racing-muted">
            O teste grátis começa automaticamente por 7 dias. Depois, o acesso continua com assinatura de R$ 50,00/mês.
          </p>
          <div className="mt-6 rounded-lg border border-racing-line bg-racing-soft p-4 text-sm text-racing-muted">
            Não há usuário ADM/admin fixo. Cada oficina cria sua própria conta, workspace e cliente Asaas.
          </div>
          <p className="mt-6 text-sm text-racing-muted">
            Já tem conta?{" "}
            <Link href="/login" className="font-black text-racing-red">
              Entrar
            </Link>
          </p>
        </section>

        <section className="rounded-lg border border-racing-line bg-racing-panel p-5 shadow-sm lg:p-8">
          {query.error ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {query.error}
            </div>
          ) : null}

          <form action="/api/auth/register" method="post" className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-bold sm:col-span-2">
              Nome da oficina
              <input name="workshopName" required className="h-11 rounded-lg px-3" placeholder="WSP Racing Oficina" />
            </label>
            <label className="space-y-1.5 text-sm font-bold">
              Nome do responsável
              <input name="ownerName" required className="h-11 rounded-lg px-3" placeholder="Seu nome" />
            </label>
            <label className="space-y-1.5 text-sm font-bold">
              Email
              <input name="email" type="email" required className="h-11 rounded-lg px-3" placeholder="oficina@email.com" />
            </label>
            <label className="space-y-1.5 text-sm font-bold">
              Telefone
              <input name="phone" required className="h-11 rounded-lg px-3" placeholder="(11) 99999-9999" />
            </label>
            <label className="space-y-1.5 text-sm font-bold">
              CPF ou CNPJ
              <input name="document" required className="h-11 rounded-lg px-3" placeholder="Somente números ou formatado" />
            </label>
            <label className="space-y-1.5 text-sm font-bold">
              Senha
              <input name="password" type="password" minLength={8} required className="h-11 rounded-lg px-3" placeholder="Mínimo 8 caracteres" />
            </label>
            <label className="space-y-1.5 text-sm font-bold">
              Confirmar senha
              <input name="confirmPassword" type="password" minLength={8} required className="h-11 rounded-lg px-3" placeholder="Repita a senha" />
            </label>
            <Button type="submit" className="sm:col-span-2">Criar conta e iniciar trial</Button>
          </form>
        </section>
      </div>
    </main>
  );
}
