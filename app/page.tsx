"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Gauge,
  MessageCircle,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Star,
  WalletCards,
  Wrench,
} from "lucide-react";
import { Logo } from "@/components/Logo";

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let frame = 0;
    const totalFrames = 52;
    const timer = window.setInterval(() => {
      frame += 1;
      const progress = 1 - Math.pow(1 - frame / totalFrames, 3);
      setCount(Math.round(value * progress));
      if (frame >= totalFrames) window.clearInterval(timer);
    }, 24);
    return () => window.clearInterval(timer);
  }, [value]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}

function DashboardMockup() {
  const rows = [
    ["OS #2481", "Honda CB 500", "Revisao completa", "14:30"],
    ["OS #2482", "Yamaha Fazer", "Freio dianteiro", "15:10"],
    ["OS #2483", "BMW GS 850", "Troca de oleo", "16:00"],
  ];

  return (
    <div className="landing-float relative mx-auto max-w-5xl" aria-label="Mockup do painel WSP Racing">
      <div className="absolute -left-5 top-16 hidden rounded-2xl border border-white/70 bg-white/90 p-4 shadow-2xl backdrop-blur md:block">
        <p className="text-xs font-black uppercase text-slate-400">Fila da oficina</p>
        <div className="mt-3 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600">
            <Wrench size={18} />
          </span>
          <div>
            <p className="text-2xl font-black text-slate-900">18</p>
            <p className="text-xs font-bold text-slate-500">servicos hoje</p>
          </div>
        </div>
      </div>

      <div className="absolute -right-3 bottom-10 hidden rounded-2xl border border-white/70 bg-white/90 p-4 shadow-2xl backdrop-blur md:block">
        <p className="text-xs font-black uppercase text-slate-400">WhatsApp</p>
        <div className="mt-3 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <MessageCircle size={18} />
          </span>
          <div>
            <p className="text-sm font-black text-slate-900">Retorno enviado</p>
            <p className="text-xs font-bold text-slate-500">cliente confirmado</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_30px_90px_rgba(31,41,55,0.16)] ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white">
              <Gauge size={21} className="text-rose-500" />
            </span>
            <div>
              <p className="text-sm font-black text-slate-900">WSP Racing</p>
              <p className="text-xs font-bold text-slate-400">Painel operacional</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-black text-slate-500">online</span>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[220px_1fr]">
          <aside className="hidden border-r border-slate-100 bg-slate-50/70 p-4 lg:block">
            {["INICIO", "OS", "Agenda", "Estoque", "Financeiro"].map((item, index) => (
              <div
                key={item}
                className={`mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-black ${
                  index === 0 ? "bg-rose-600 text-white shadow-lg shadow-rose-200" : "text-slate-500"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${index === 0 ? "bg-white" : "bg-slate-300"}`} />
                {item}
              </div>
            ))}
          </aside>

          <div className="bg-[#f9fafb] p-4 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Faturamento", "R$ 18.420", "mes atual"],
                ["OS abertas", "42", "em producao"],
                ["Estoque baixo", "7", "pecas criticas"],
              ].map(([title, value, helper]) => (
                <div key={title} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <p className="text-xs font-black uppercase text-slate-400">{title}</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
                  <p className="mt-1 text-xs font-bold text-slate-400">{helper}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_260px]">
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="font-black text-slate-900">Ordens em andamento</p>
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-600">ao vivo</span>
                </div>
                <div className="mt-4 space-y-3">
                  {rows.map(([os, bike, service, time]) => (
                    <div key={os} className="grid grid-cols-[82px_1fr_auto] items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                      <span className="text-xs font-black text-rose-600">{os}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900">{bike}</p>
                        <p className="truncate text-xs font-bold text-slate-400">{service}</p>
                      </div>
                      <span className="text-xs font-black text-slate-500">{time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="font-black text-slate-900">Fluxo de caixa</p>
                <div className="mt-5 space-y-4">
                  {[82, 58, 74, 44].map((width, index) => (
                    <div key={width}>
                      <div className="mb-2 flex justify-between text-xs font-bold text-slate-400">
                        <span>{["Seg", "Ter", "Qua", "Qui"][index]}</span>
                        <span>{width}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className="landing-load h-2 rounded-full bg-rose-600" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-xl bg-slate-950 p-4 text-white">
                  <p className="text-xs font-bold text-slate-300">Recebido hoje</p>
                  <p className="mt-1 text-2xl font-black">R$ 4.780</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const features = useMemo(
    () => [
      { icon: ClipboardList, title: "Controle de OS", copy: "Abra, acompanhe e finalize ordens de serviço com histórico claro do cliente e da moto." },
      { icon: CalendarCheck, title: "Agendamento inteligente", copy: "Organize a fila por horário, mecânico responsável e status de produção." },
      { icon: WalletCards, title: "Financeiro e caixa", copy: "Venda à vista, a prazo, controle recebimentos e enxergue o lucro bruto da oficina." },
      { icon: PackageCheck, title: "Estoque de peças", copy: "Produtos com foto, código de barras, estoque baixo e leitura no PDV." },
      { icon: ReceiptText, title: "Histórico de veículos", copy: "Veja tudo que já foi feito em cada moto para vender melhor e atender com precisão." },
    ],
    [],
  );

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-white text-[#1f2937]">
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Logo href="/" />
          <nav className="hidden items-center gap-8 text-sm font-bold text-slate-500 md:flex">
            <a href="#funcionalidades" className="hover:text-rose-600">Funcionalidades</a>
            <a href="#beneficios" className="hover:text-rose-600">Benefícios</a>
            <a href="#depoimentos" className="hover:text-rose-600">Depoimentos</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50 sm:inline-flex">
              Login
            </Link>
            <Link href="/register" className="rounded-full bg-rose-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-rose-200 hover:bg-rose-700 sm:px-5">
              Criar conta
            </Link>
            <Link href="/register" className="hidden rounded-full border border-rose-100 bg-rose-50 px-4 py-2.5 text-sm font-black text-rose-700 hover:bg-rose-100 lg:inline-flex">
              Teste Grátis
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f9fafb_100%)]">
        <div className="absolute left-1/2 top-24 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-rose-100/60 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-20 lg:px-8">
          <div className="mx-auto max-w-4xl text-center" data-reveal>
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white px-4 py-2 text-sm font-black text-rose-700 shadow-sm">
              <Sparkles size={16} />
              Gestão premium para oficinas que vivem de velocidade e precisão
            </div>
            <h1 className="mt-7 text-balance text-5xl font-black leading-[0.96] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
              Acelere a gestão da sua oficina. Sem travar.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg font-medium leading-8 text-slate-600">
              O WSP Racing centraliza OS, agenda, estoque, PDV, financeiro e relacionamento com clientes em uma operação leve para desktop e celular.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register" className="landing-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-rose-600 px-7 text-base font-black text-white shadow-xl shadow-rose-200 hover:bg-rose-700">
                Começar teste grátis
                <ArrowRight size={18} />
              </Link>
              <a href="#funcionalidades" className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-7 text-base font-black text-slate-700 shadow-sm hover:border-rose-200 hover:text-rose-700">
                Ver funcionalidades
              </a>
            </div>
          </div>

          <div className="mt-14" data-reveal>
            <DashboardMockup />
          </div>
        </div>
      </section>

      <section id="funcionalidades" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl" data-reveal>
            <p className="text-sm font-black uppercase text-rose-600">O sistema contém</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">Tudo que a oficina usa, sem virar bagunça.</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {features.map(({ icon: Icon, title, copy }) => (
              <article
                key={title}
                className="landing-card rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_10px_32px_rgba(15,23,42,0.06)]"
                data-reveal
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
                  <Icon size={22} />
                </span>
                <h3 className="mt-5 text-lg font-black text-slate-900">{title}</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-500">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="beneficios" className="bg-[#f9fafb] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div data-reveal>
            <p className="text-sm font-black uppercase text-rose-600">Por que escolher</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">Menos papelada. Mais serviço entregue. Mais retorno.</h2>
            <p className="mt-5 text-lg font-medium leading-8 text-slate-600">
              A WSP Racing foi pensada para oficina real: balcão corrido, mecânico chamando, cliente no WhatsApp e peça que precisa aparecer rápido.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { value: 15, suffix: "h", title: "economizadas por semana", copy: "Menos retrabalho com OS, estoque e fechamento financeiro." },
              { value: 0, suffix: "", title: "papelada espalhada", copy: "Tudo fica registrado por cliente, moto, venda e mecânico." },
              { value: 28, suffix: "%", title: "mais retornos agendados", copy: "Lembretes por WhatsApp ajudam a recuperar revisões e serviços." },
              { value: 3, suffix: "x", title: "mais velocidade no balcão", copy: "PDV com código de barras, estoque simples e venda a prazo." },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-white bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.07)]" data-reveal>
                <p className="text-4xl font-black text-rose-600">
                  <AnimatedNumber value={item.value} suffix={item.suffix} />
                </p>
                <h3 className="mt-3 text-lg font-black text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{item.copy}</p>
                <div className="mt-5 h-2 rounded-full bg-slate-100">
                  <div className="landing-load h-2 rounded-full bg-rose-600" style={{ width: item.value === 0 ? "100%" : `${Math.min(92, item.value * 4)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="depoimentos" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div data-reveal>
              <p className="text-sm font-black uppercase text-rose-600">Depoimentos</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900">Feito para dono de oficina que quer controle sem complicação.</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["A gente parou de perder orçamento no WhatsApp. Agora a equipe sabe o que está em produção e o que falta receber.", "Marcelo T.", "Oficina premium multimarcas"],
                ["O estoque simples salvou o balcão. Bipa, acha a peça e vende. O completo fica perfeito para apresentar produto com foto.", "Renata S.", "Centro técnico de motos"],
              ].map(([quote, name, role]) => (
                <article key={name} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.07)]" data-reveal>
                  <div className="flex gap-1 text-rose-500">
                    {[0, 1, 2, 3, 4].map((star) => <Star key={star} size={16} fill="currentColor" />)}
                  </div>
                  <p className="mt-5 text-base font-semibold leading-7 text-slate-700">“{quote}”</p>
                  <div className="mt-6 border-t border-slate-100 pt-4">
                    <p className="font-black text-slate-900">{name}</p>
                    <p className="text-sm font-medium text-slate-500">{role}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-slate-950 p-8 text-white shadow-2xl sm:p-12" data-reveal>
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black text-rose-200">
                <ShieldCheck size={16} />
                Trial gratuito de 7 dias
              </div>
              <h2 className="mt-5 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">Sua oficina merece um sistema com cara de oficina grande.</h2>
              <p className="mt-4 max-w-xl text-base font-medium leading-7 text-slate-300">
                Comece hoje, cadastre equipe, produtos, clientes e rode seu primeiro atendimento com o WSP Racing.
              </p>
            </div>
            <Link href="/register" className="landing-cta inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-rose-600 px-8 text-base font-black text-white shadow-xl shadow-rose-950/40 hover:bg-rose-500">
              Criar conta agora
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <Logo href="/" compact />
          <p>WSP Racing. Gestão premium para oficinas mecânicas.</p>
        </div>
      </footer>
    </main>
  );
}
