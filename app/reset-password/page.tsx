import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/Button";
import { redirectIfAuthenticated } from "@/lib/auth";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; state?: string; error?: string }>;
}) {
  const query = await searchParams;
  await redirectIfAuthenticated();
  const hasToken = Boolean(query.token && query.state);

  return (
    <main className="login-shell relative grid min-h-screen place-items-center overflow-hidden bg-[#08090c] px-5 py-10 text-white">
      <div className="login-grid absolute inset-0 opacity-40" />
      <div className="login-orb login-orb-two" />
      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3 text-white">
          <Image src="/icons/wsp-app-icon-48.png" alt="WSP Racing" width={52} height={52} priority className="rounded-2xl" />
          <span className="text-xl font-black italic">WSP <span className="text-red-500">Racing</span></span>
        </Link>
        <section className="login-card rounded-2xl border border-white/10 bg-white/[0.065] p-6 backdrop-blur-xl">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-red-500/10 text-red-400"><ShieldCheck size={22} /></span>
          <h1 className="mt-5 text-3xl font-black">Criar nova senha</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Use uma senha com no mínimo 8 caracteres e diferente da anterior.</p>
          {query.error ? <div className="mt-5 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm font-semibold text-red-200">{query.error}</div> : null}
          {hasToken ? (
            <form action="/api/auth/reset-password" method="post" className="mt-6 space-y-4">
              <input type="hidden" name="token" value={query.token} />
              <input type="hidden" name="state" value={query.state} />
              <label className="block space-y-2 text-sm font-bold text-zinc-200">
                Nova senha
                <span className="relative block">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input name="password" type="password" minLength={8} required autoFocus autoComplete="new-password" className="h-12 rounded-xl border-white/10 bg-black/25 pl-11 pr-3 text-white placeholder:text-zinc-600" placeholder="Mínimo 8 caracteres" />
                </span>
              </label>
              <label className="block space-y-2 text-sm font-bold text-zinc-200">
                Confirmar nova senha
                <span className="relative block">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input name="confirmPassword" type="password" minLength={8} required autoComplete="new-password" className="h-12 rounded-xl border-white/10 bg-black/25 pl-11 pr-3 text-white placeholder:text-zinc-600" placeholder="Repita a senha" />
                </span>
              </label>
              <Button type="submit" className="login-shine h-12 w-full rounded-xl">Salvar nova senha</Button>
            </form>
          ) : (
            <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm font-semibold leading-6 text-amber-100">
              O link está ausente, expirou ou já foi utilizado. Solicite uma nova recuperação.
            </div>
          )}
          <Link href={hasToken ? "/login" : "/forgot-password"} className="mt-6 inline-flex items-center gap-2 text-sm font-black text-zinc-400 hover:text-white">
            <ArrowLeft size={16} />
            {hasToken ? "Voltar ao login" : "Solicitar novo link"}
          </Link>
        </section>
      </div>
    </main>
  );
}
