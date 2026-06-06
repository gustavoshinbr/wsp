"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

export function SebraeGuideActions({ summary, portalUrl }: { summary: string; portalUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={copySummary}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-racing-line bg-racing-panel px-4 py-2 text-sm font-bold"
      >
        {copied ? <Check size={17} /> : <Copy size={17} />}
        {copied ? "Dados copiados" : "Copiar dados"}
      </button>
      <a
        href={portalUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-racing-red px-4 py-2 text-sm font-bold text-white"
      >
        Abrir Emissor Sebrae
        <ExternalLink size={17} />
      </a>
    </div>
  );
}
