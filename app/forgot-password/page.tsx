import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/Button";
import { redirectIfAuthenticated } from "@/lib/auth";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const query = await searchParams;
  await redirectIfAuthenticated();

  return (
    <main className="login-shell relative grid min-h-screen place-items-center overflow-hidden bg-[#08090c] px-5 py-10 text-white">
      <div className="login-grid absolute inset-0 opacity-40" />
      <div className="login-orb login-orb-one" />
      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3 text-white">
          <Image src="/icons/wsp-app-icon-48.png" alt="WSP Racing" width={52} height={52} priority className="rounded-2xl" />
          <span className="text-xl font-black italic">WSP <span className="text-red-500">Racing</span></span>
        </Link>
        <section className="login-card rounded-2xl border border-white/10 bg-white/[0.065] p-6 backdrop-blur-xl">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-red-500/10 text-red-400"><ShieldCheck size={22} /></span>
          <h1 className="mt-5 text-3xl font-black">Recuperar senha</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Informe seu email. Se houver uma conta ativa, enviaremos um link seguro válido por 15 minutos.</p>
          {query.sent ? (
            <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-semibold leading-6 text-emerald-200">
              Solicitação recebida. Verifique sua caixa de entrada e a pasta de spam.
            </div>
          ) : (
            <form action="/api/auth/forgot-password" method="post" className="mt-6 space-y-4">
              <label className="block space-y-2 text-sm font-bold text-zinc-200">
                Email da conta
                <span className="relative block">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input name="email" type="email" required autoFocus autoComplete="email" className="h-12 rounded-xl border-white/10 bg-black/25 pl-11 pr-3 text-white placeholder:text-zinc-600" placeholder="oficina@email.com" />
                </span>
              </label>
              <Button type="submit" className="login-shine h-12 w-full rounded-xl">Enviar link seguro</Button>
            </form>
          )}
          <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-black text-zinc-400 hover:text-white">
            <ArrowLeft size={16} />
            Voltar ao login
          </Link>
        </section>
      </div>
    </main>
  );
}
