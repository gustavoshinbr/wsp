import Link from "next/link";
import { MessageCircle } from "lucide-react";

export function WhatsAppButton({ href, label = "Enviar via WhatsApp" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
    >
      <MessageCircle size={17} />
      {label}
    </Link>
  );
}
