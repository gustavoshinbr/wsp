import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  PackageSearch,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";

const features = [
  {
    icon: Wrench,
    title: "Serviços e orçamentos",
    description: "Crie, edite e acompanhe cada serviço, orçamento e ordem da oficina.",
  },
  {
    icon: CalendarCheck2,
    title: "Agenda organizada",
    description: "Controle horários, clientes, motos e o andamento dos agendamentos.",
  },
  {
    icon: ShoppingCart,
    title: "PDV rápido",
    description: "Venda produtos e serviços com leitura de código de barras no celular.",
  },
  {
    icon: PackageSearch,
    title: "Estoque monitorado",
    description: "Encontre peças rapidamente e receba alertas antes que o estoque acabe.",
  },
  {
    icon: Users,
    title: "Histórico do cliente",
    description: "Mantenha clientes, motos e atendimentos reunidos no mesmo lugar.",
  },
  {
    icon: ReceiptText,
    title: "Financeiro e fiscal",
    description: "Acompanhe vendas, recebimentos e documentos fiscais com mais clareza.",
  },
];

function Brand() {
  return (
    <Link href="/" className="inline-flex items-center gap-3 text-white">
      <Image
        src="/icons/wsp-app-icon-48.png"
        alt="WSP Racing"
        width={48}
        height={48}
        priority
        className="h-12 w-12 rounded-2xl shadow-[0_12px_34px_rgba(220,38,38,0.3)] ring-1 ring-white/15"
      />
      <span className="leading-none">
        <span className="block text-lg font-black italic">
          WSP <span className="text-red-500">Racing</span>
        </span>
        <span className="mt-1 block text-[9px] font-black uppercase tracking-[0.26em] text-zinc-500">
          Oficina Pro
        </span>
      </span>
    </Link>
  );
}

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-4xl" aria-label="Captura real do painel WSP Racing">
      <div className="absolute -inset-8 -z-10 rounded-full bg-red-600/10 blur-3xl" />

      <div className="landing-demo-frame overflow-hidden rounded-[24px] border border-white/10 bg-[#101115] shadow-[0_40px_120px_rgba(0,0,0,0.65)] ring-1 ring-white/[0.04] sm:rounded-[30px]">
        <div className="flex h-10 items-center border-b border-white/[0.07] bg-black/30 px-4">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <span className="mx-auto hidden rounded-md border border-white/[0.06] bg-white/[0.035] px-10 py-1 text-[8px] font-bold text-zinc-600 sm:block">
            app.wspracing.com.br/dashboard
          </span>
          <span className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-wider text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
            online
          </span>
        </div>
        <div className="relative aspect-[3/2] bg-white">
          <Image
            src="/images/dashboard-demonstracao.png"
            alt="Dashboard real do WSP Racing preenchido com dados fictícios de demonstração"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 58vw"
            className="object-cover object-top"
          />
        </div>
      </div>

      <p className="mt-4 text-center text-xs font-bold text-zinc-500">
        Captura real do sistema com dados fictícios de demonstração.
      </p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="login-shell relative min-h-screen overflow-hidden bg-[#08090c] text-white">
      <div className="login-grid fixed inset-0 opacity-40" />
      <div className="login-orb login-orb-one fixed" />
      <div className="login-orb login-orb-two fixed" />

      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#08090c]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Brand />
          <nav className="hidden items-center gap-7 text-sm font-bold text-zinc-400 md:flex">
            <a href="#recursos" className="hover:text-white">Recursos</a>
            <a href="#seguranca" className="hover:text-white">Segurança</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-xl px-3 py-2.5 text-sm font-black text-zinc-300 hover:bg-white/[0.06]">
              Entrar
            </Link>
            <Link
              href="/register"
              className="login-shine rounded-xl bg-red-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-red-950/40 hover:bg-red-500"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      <section className="relative z-10 px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pb-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.84fr_1.16fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-black text-red-300">
              <Sparkles size={14} />
              Gestão completa para sua oficina
            </span>
            <h1 className="mt-6 text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              Sua oficina rápida.
              <span className="block text-red-500">Sua gestão também.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base font-medium leading-7 text-zinc-400 sm:text-lg sm:leading-8">
              Clientes, motos, agenda, estoque, vendas e serviços em um sistema bonito, estável e pronto para desktop e celular.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="login-shine inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-red-600 px-7 py-3.5 text-base font-black shadow-[0_16px_40px_rgba(220,38,38,0.28)] hover:bg-red-500"
              >
                Começar agora
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-13 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-7 py-3.5 text-base font-black text-zinc-200 hover:bg-white/[0.09]"
              >
                Acessar o painel
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-zinc-500">
              {["7 dias grátis", "Sem instalação", "Funciona no celular"].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section id="recursos" className="relative z-10 border-y border-white/[0.07] bg-black/20 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-red-400">Tudo conectado</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Controle sem complicar o balcão.</h2>
            <p className="mt-4 text-base leading-7 text-zinc-400">
              Uma experiência consistente para a equipe trabalhar com menos cliques e encontrar o que precisa rapidamente.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="landing-card rounded-2xl border border-white/10 bg-white/[0.045] p-6 backdrop-blur-sm"
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
                  <Icon size={22} />
                </span>
                <h3 className="mt-5 text-lg font-black">{title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-zinc-500">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="seguranca" className="relative z-10 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 rounded-[28px] border border-white/10 bg-white/[0.05] p-7 shadow-2xl backdrop-blur-xl sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-emerald-400">
              <ShieldCheck size={18} />
              Segurança em primeiro lugar
            </span>
            <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
              Dados da oficina protegidos do navegador ao banco.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
              Permissões verificadas no servidor, sessões protegidas e validação de cada operação sensível.
            </p>
          </div>
          <Link
            href="/register"
            className="login-shine inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-red-600 px-7 py-3.5 text-base font-black shadow-lg shadow-red-950/50 hover:bg-red-500"
          >
            Criar minha conta
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/[0.07] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Brand />
          <p className="text-sm font-semibold text-zinc-600">WSP Racing. Gestão profissional para oficinas.</p>
        </div>
      </footer>
    </main>
  );
}
