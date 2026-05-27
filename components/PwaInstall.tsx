"use client";

import { CheckCircle2, Download, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type InstallStatus = "checking" | "ready" | "installed" | "ios" | "unavailable";

let installPrompt: BeforeInstallPromptEvent | null = null;
let currentStatus: InstallStatus = "checking";
const listeners = new Set<(status: InstallStatus) => void>();

function isStandalone() {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function setInstallStatus(status: InstallStatus) {
  currentStatus = status;
  listeners.forEach((listener) => listener(status));
}

function subscribe(listener: (status: InstallStatus) => void) {
  listeners.add(listener);
  listener(currentStatus);
  return () => {
    listeners.delete(listener);
  };
}

export function PwaInstaller() {
  useEffect(() => {
    if (isStandalone()) {
      setInstallStatus("installed");
    } else if (isIos()) {
      setInstallStatus("ios");
    } else {
      setInstallStatus(installPrompt ? "ready" : "unavailable");
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => null);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      installPrompt = event as BeforeInstallPromptEvent;
      setInstallStatus("ready");
    };

    const handleAppInstalled = () => {
      installPrompt = null;
      setInstallStatus("installed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  return null;
}

export function PwaInstallButton() {
  const [status, setStatus] = useState<InstallStatus>(currentStatus);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => subscribe(setStatus), []);

  async function handleInstall() {
    if (!installPrompt || isInstalling) return;

    setIsInstalling(true);
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      installPrompt = null;
      setInstallStatus(choice.outcome === "accepted" || isStandalone() ? "installed" : "unavailable");
    } finally {
      setIsInstalling(false);
    }
  }

  const ready = status === "ready";
  const installed = status === "installed";
  const ios = status === "ios";

  return (
    <div className="rounded-lg border border-racing-line bg-racing-soft p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-racing-red text-white">
          {installed ? <CheckCircle2 size={20} /> : <Smartphone size={20} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">Instalar PWA (aplicativo)</p>
          <p className="mt-1 text-xs font-semibold text-racing-muted">
            {installed
              ? "Aplicativo instalado neste aparelho."
              : ready
                ? "Disponível para instalar neste navegador."
                : ios
                  ? "No iPhone, use Compartilhar e Adicionar à Tela de Início."
                  : "Abra no celular pelo Chrome ou Edge para instalar."}
          </p>
        </div>
      </div>

      <Button type="button" className="mt-4 w-full" onClick={handleInstall} disabled={!ready || isInstalling}>
        <Download size={18} />
        {installed ? "Aplicativo instalado" : isInstalling ? "Abrindo instalação..." : "Instalar aplicativo"}
      </Button>
    </div>
  );
}
