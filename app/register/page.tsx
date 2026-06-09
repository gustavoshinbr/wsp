import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  FileText,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/Button";
import { redirectIfAuthenticated } from "@/lib/auth";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  await redirectIfAuthenticated();

  return (
    <main className="login-shell relative min-h-screen overflow-hidden bg-[#08090c] text-white">
      <div className="login-grid absolute inset-0 opacity-40" />
      <div className="login-orb login-orb-one" />
      <div className="login-orb login-orb-two" />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:px-8">
        <section className="py-4 lg:py-10">
          <Link href="/" className="inline-flex items-center gap-3 text-white">
            <Image src="/icons/wsp-app-icon-48.png" alt="WSP Racing" width={52} height={52} priority className="h-[52px] w-[52px] rounded-2xl shadow-[0_14px_40px_rgba(220,38,38,0.3)] ring-1 ring-white/15" />
            <span className="leading-none">
              <span className="block text-xl font-black italic">WSP <span className="text-red-500">Racing</span></span>
              <span className="mt-1 block text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">Oficina Pro</span>
            </span>
          </Link>

          <span className="mt-10 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-black text-red-300">
            <Sparkles size={14} />
            7 dias para acelerar sua gestão
          </span>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Sua oficina começa organizada.</h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-zinc-400">
            Crie seu espaço exclusivo, cadastre sua equipe e rode clientes, agenda, estoque e vendas em um painel feito para oficina.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {[
              "Conta e dados isolados por oficina",
              "Sem cartão no período de teste",
              "Acesso por celular e computador",
              "Segurança aplicada no servidor",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] p-3 text-sm font-bold text-zinc-300">
                <CheckCircle2 size={17} className="shrink-0 text-emerald-400" />
                {item}
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm text-zinc-500">
            Já tem conta?{" "}
            <Link href="/login" className="font-black text-red-400 hover:text-red-300 hover:underline">Entrar no painel</Link>
          </p>
        </section>

        <section className="login-card rounded-[28px] border border-white/10 bg-white/[0.065] p-5 shadow-2xl backdrop-blur-xl sm:p-7 lg:p-8">
          <div className="mb-6">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-red-400">
              <ShieldCheck size={15} />
              Cadastro seguro
            </p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">Criar conta da oficina</h2>
            <p className="mt-2 text-sm text-zinc-500">Preencha os dados principais. Você poderá ajustar o restante depois.</p>
          </div>

          {query.error ? (
            <div className="mb-5 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm font-semibold text-red-200" role="alert">{query.error}</div>
          ) : null}

          <form action="/api/auth/register" method="post" className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-bold text-zinc-200 sm:col-span-2">
              Nome da oficina
              <span className="relative block">
                <Building2 className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input name="workshopName" required autoFocus className="h-12 rounded-xl border-white/10 bg-black/25 pl-11 pr-3 text-white placeholder:text-zinc-600" placeholder="WSP Racing Oficina" />
              </span>
            </label>
            <label className="space-y-2 text-sm font-bold text-zinc-200">
              Responsável
              <span className="relative block">
                <UserRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input name="ownerName" required className="h-12 rounded-xl border-white/10 bg-black/25 pl-11 pr-3 text-white placeholder:text-zinc-600" placeholder="Seu nome" />
              </span>
            </label>
            <label className="space-y-2 text-sm font-bold text-zinc-200">
              Email
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input name="email" type="email" required autoComplete="email" className="h-12 rounded-xl border-white/10 bg-black/25 pl-11 pr-3 text-white placeholder:text-zinc-600" placeholder="oficina@email.com" />
              </span>
            </label>
            <label className="space-y-2 text-sm font-bold text-zinc-200">
              Telefone
              <span className="relative block">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input name="phone" required inputMode="tel" autoComplete="tel" className="h-12 rounded-xl border-white/10 bg-black/25 pl-11 pr-3 text-white placeholder:text-zinc-600" placeholder="(11) 99999-9999" />
              </span>
            </label>
            <label className="space-y-2 text-sm font-bold text-zinc-200">
              CPF ou CNPJ
              <span className="relative block">
                <FileText className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input name="document" required inputMode="numeric" className="h-12 rounded-xl border-white/10 bg-black/25 pl-11 pr-3 text-white placeholder:text-zinc-600" placeholder="Somente números" />
              </span>
            </label>
            <label className="space-y-2 text-sm font-bold text-zinc-200">
              Senha
              <span className="relative block">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input name="password" type="password" minLength={8} required autoComplete="new-password" className="h-12 rounded-xl border-white/10 bg-black/25 pl-11 pr-3 text-white placeholder:text-zinc-600" placeholder="Mínimo 8 caracteres" />
              </span>
            </label>
            <label className="space-y-2 text-sm font-bold text-zinc-200">
              Confirmar senha
              <span className="relative block">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input name="confirmPassword" type="password" minLength={8} required autoComplete="new-password" className="h-12 rounded-xl border-white/10 bg-black/25 pl-11 pr-3 text-white placeholder:text-zinc-600" placeholder="Repita a senha" />
              </span>
            </label>
            <Button type="submit" className="login-shine h-12 rounded-xl sm:col-span-2">Criar conta e iniciar teste</Button>
          </form>
        </section>
      </div>
    </main>
  );
}
