import Image from "next/image";
import Link from "next/link";
import {
  Boxes,
  CalendarCheck2,
  CheckCircle2,
  Gauge,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/Button";
import { redirectIfAuthenticated } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string; reset?: string }> }) {
  const query = await searchParams;
  await redirectIfAuthenticated();

  return (
    <main className="login-shell relative min-h-screen overflow-hidden bg-[#08090c] text-white">
      <div className="login-grid absolute inset-0 opacity-40" />
      <div className="login-orb login-orb-one" />
      <div className="login-orb login-orb-two" />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[minmax(420px,0.82fr)_1.18fr]">
        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:bg-white/[0.025] lg:backdrop-blur-sm">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-8 inline-flex items-center gap-3 text-white">
              <Image
                src="/icons/wsp-app-icon-48.png"
                alt="WSP Racing"
                width={52}
                height={52}
                priority
                className="h-[52px] w-[52px] rounded-2xl shadow-[0_14px_40px_rgba(220,38,38,0.3)] ring-1 ring-white/15"
              />
              <span className="leading-none">
                <span className="block text-xl font-black italic">WSP <span className="text-red-500">Racing</span></span>
                <span className="mt-1 block text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">Oficina Pro</span>
              </span>
            </Link>

            <div className="mb-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-black text-red-300">
                <Sparkles size={14} />
                Sua oficina em movimento
              </span>
              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Bem-vindo de volta.</h1>
              <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-400">
                Entre para acompanhar agenda, estoque, serviços e vendas em um só painel.
              </p>
            </div>

            {query.error ? (
              <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm font-semibold text-red-200" role="alert">
                {query.error}
              </div>
            ) : null}
            {query.reset ? (
              <div className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-200" role="status">
                Senha alterada com sucesso. Entre usando sua nova senha.
              </div>
            ) : null}

            <form action="/api/auth/login" method="post" className="login-card space-y-4 rounded-2xl border border-white/10 bg-white/[0.065] p-5 shadow-2xl backdrop-blur-xl sm:p-6">
              <input type="hidden" name="next" value={query.next || ""} />
              <label className="block space-y-2 text-sm font-bold text-zinc-200">
                Email
                <span className="relative block">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    autoFocus
                    className="h-12 rounded-xl border-white/10 bg-black/25 pl-11 pr-3 text-white placeholder:text-zinc-600"
                    placeholder="oficina@email.com"
                  />
                </span>
              </label>
              <label className="block space-y-2 text-sm font-bold text-zinc-200">
                Senha
                <span className="relative block">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    minLength={8}
                    className="h-12 rounded-xl border-white/10 bg-black/25 pl-11 pr-3 text-white placeholder:text-zinc-600"
                    placeholder="Sua senha"
                  />
                </span>
              </label>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2.5 text-sm font-semibold text-zinc-400">
                  <input name="remember" type="checkbox" className="h-4 w-4 rounded border-white/20 bg-black/30 accent-red-600" />
                  Manter conectado
                </label>
                <Link href="/forgot-password" className="text-sm font-black text-red-400 hover:text-red-300 hover:underline">Esqueci minha senha</Link>
              </div>
              <Button type="submit" className="login-shine h-12 w-full rounded-xl shadow-[0_12px_35px_rgba(220,38,38,0.28)]">
                Entrar no painel
              </Button>
            </form>

            <p className="mt-6 text-sm text-zinc-500">
              Ainda não tem conta?{" "}
              <Link href="/register" className="font-black text-red-400 hover:text-red-300 hover:underline">
                Começar agora
              </Link>
            </p>
          </div>
        </section>

        <section className="relative hidden items-center justify-center px-10 py-12 lg:flex">
          <div className="w-full max-w-3xl">
            <div className="mb-8 max-w-2xl">
              <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-red-400">
                <ShieldCheck size={17} />
                Operação sob controle
              </p>
              <h2 className="mt-4 text-5xl font-black leading-[1.05] tracking-tight xl:text-6xl">
                Menos papelada.<br />
                Mais oficina rodando.
              </h2>
            </div>

            <div className="login-float relative rounded-[28px] border border-white/10 bg-white/[0.055] p-4 shadow-[0_35px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl xl:p-5">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-red-600 shadow-lg shadow-red-950/50">
                    <Gauge size={22} />
                  </span>
                  <div>
                    <p className="font-black">Visão da oficina</p>
                    <p className="text-xs font-semibold text-zinc-500">Atualização em tempo real</p>
                  </div>
                </div>
                <span className="flex items-center gap-2 text-xs font-black text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                  online
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Serviços hoje", value: "18", icon: Wrench, tone: "text-red-400" },
                  { label: "Agenda confirmada", value: "92%", icon: CalendarCheck2, tone: "text-amber-400" },
                  { label: "Estoque monitorado", value: "247", icon: Boxes, tone: "text-sky-400" },
                ].map(({ label, value, icon: Icon, tone }) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <Icon size={18} className={tone} />
                    <p className="mt-5 text-2xl font-black">{value}</p>
                    <p className="mt-1 text-xs font-bold text-zinc-500">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                {[
                  ["Honda CB 500", "Revisão completa", "14:30"],
                  ["Yamaha Fazer", "Freio dianteiro", "15:10"],
                  ["BMW GS 850", "Troca de óleo", "16:00"],
                ].map(([moto, service, time]) => (
                  <div key={moto} className="flex items-center gap-3 border-b border-white/[0.07] py-3 first:pt-0 last:border-0 last:pb-0">
                    <CheckCircle2 size={17} className="shrink-0 text-emerald-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black">{moto}</p>
                      <p className="truncate text-xs font-semibold text-zinc-500">{service}</p>
                    </div>
                    <span className="text-xs font-black text-zinc-400">{time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
