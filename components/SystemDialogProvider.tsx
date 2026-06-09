"use client";

import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";

type DialogOptions = {
  title?: string;
  message: string;
  tone?: "info" | "danger" | "success";
  confirmLabel?: string;
  cancelLabel?: string;
};

type DialogContextValue = {
  alert: (options: DialogOptions | string) => Promise<void>;
  confirm: (options: DialogOptions | string) => Promise<boolean>;
};

const DialogContext = createContext<DialogContextValue | null>(null);

export function SystemDialogProvider({ children }: { children: React.ReactNode }) {
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const [dialog, setDialog] = useState<(DialogOptions & { type: "alert" | "confirm" }) | null>(null);

  const open = useCallback((type: "alert" | "confirm", options: DialogOptions | string) => {
    const normalized = typeof options === "string" ? { message: options } : options;
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setDialog({ type, tone: "info", ...normalized });
    });
  }, []);

  const close = useCallback((result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setDialog(null);
  }, []);

  useEffect(() => {
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, dialog]);

  const value = useMemo<DialogContextValue>(() => ({
    alert: async (options) => {
      await open("alert", options);
    },
    confirm: (options) => open("confirm", options),
  }), [open]);

  const tone = dialog?.tone || "info";
  const Icon = tone === "danger" ? AlertTriangle : tone === "success" ? CheckCircle2 : Info;

  return (
    <DialogContext.Provider value={value}>
      {children}
      {dialog ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) close(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="system-dialog-title"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-racing-line bg-racing-panel shadow-[0_30px_100px_rgba(0,0,0,0.5)]"
          >
            <div className="relative border-b border-racing-line bg-racing-soft p-5">
              <div className="flex items-start gap-3 pr-10">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                  tone === "danger"
                    ? "bg-red-500/10 text-red-500"
                    : tone === "success"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-racing-red/10 text-racing-red"
                }`}>
                  <Icon size={21} />
                </span>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-racing-red">WSP Racing</p>
                  <h2 id="system-dialog-title" className="mt-1 text-xl font-black">
                    {dialog.title || (dialog.type === "confirm" ? "Confirmar ação" : "Aviso do sistema")}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => close(false)}
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-lg border border-racing-line text-racing-muted hover:bg-racing-panel"
                aria-label="Fechar"
              >
                <X size={17} />
              </button>
            </div>
            <div className="p-5">
              <p className="whitespace-pre-line text-sm font-medium leading-6 text-racing-muted">{dialog.message}</p>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                {dialog.type === "confirm" ? (
                  <button
                    type="button"
                    onClick={() => close(false)}
                    className="min-h-11 rounded-lg border border-racing-line px-4 text-sm font-bold text-racing-muted hover:bg-racing-soft"
                  >
                    {dialog.cancelLabel || "Cancelar"}
                  </button>
                ) : null}
                <button
                  type="button"
                  autoFocus
                  onClick={() => close(true)}
                  className={`min-h-11 rounded-lg px-5 text-sm font-black text-white ${
                    tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-racing-red hover:bg-red-700"
                  }`}
                >
                  {dialog.confirmLabel || (dialog.type === "confirm" ? "Confirmar" : "Entendi")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </DialogContext.Provider>
  );
}

export function useSystemDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useSystemDialog deve ser usado dentro de SystemDialogProvider.");
  return context;
}
