"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export function ActionModal({
  open,
  title,
  description,
  onClose,
  children,
  maxWidth = "max-w-xl",
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div className={`my-auto w-full ${maxWidth} rounded-2xl border border-racing-line bg-racing-panel p-5 shadow-2xl`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black">{title}</h2>
            {description ? <p className="mt-1 text-sm text-racing-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            aria-label="Fechar janela"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-racing-line text-racing-muted hover:bg-racing-soft"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
