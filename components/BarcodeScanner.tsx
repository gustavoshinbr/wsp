"use client";

import { ScanLine, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ScannerControls = {
  stop: () => void;
};

export function BarcodeScanner({
  onDetected,
  buttonLabel = "Scanner",
  className = "",
}: {
  onDetected: (value: string) => void;
  buttonLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<ScannerControls | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  function stopCamera() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    const stream = streamRef.current || videoRef.current?.srcObject;
    if (stream instanceof MediaStream) stream.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setOpen(false);
  }

  useEffect(() => stopCamera, []);

  async function startCamera() {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setMessage("A câmera precisa de HTTPS e de um navegador atualizado.");
      return;
    }

    setOpen(true);
    setMessage("Solicitando acesso à câmera...");

    try {
      const streamPromise = navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      const decoderPromise = import("@zxing/browser");
      const [stream, { BrowserMultiFormatReader }] = await Promise.all([streamPromise, decoderPromise]);
      streamRef.current = stream;
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        return;
      }

      const reader = new BrowserMultiFormatReader();
      controlsRef.current = await reader.decodeFromStream(
        stream,
        videoRef.current,
        (result) => {
          const value = result?.getText().trim();
          if (!value) return;
          onDetected(value);
          setMessage("Código lido com sucesso.");
          stopCamera();
        },
      );
      setMessage("Aponte a câmera para o código de barras.");
    } catch (error) {
      stopCamera();
      const name = error instanceof Error ? error.name : "";
      setMessage(
        name === "NotAllowedError"
          ? "Permissão da câmera negada. Libere a câmera nas configurações do navegador."
          : "Não foi possível abrir a câmera. Verifique a permissão e tente novamente.",
      );
    }
  }

  return (
    <>
      <button
        type="button"
        className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-racing-line px-3 text-sm font-black ${className}`}
        onClick={startCamera}
        title="Ler código de barras com a câmera"
      >
        <ScanLine size={17} />
        <span className="hidden sm:inline">{buttonLabel}</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/15 bg-zinc-950 text-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-black">Scanner de código de barras</p>
                <p className="text-xs text-zinc-400">{message}</p>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-zinc-300"
                aria-label="Fechar câmera"
              >
                <X size={18} />
              </button>
            </div>
            <div className="relative bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="max-h-[68vh] min-h-72 w-full object-cover" />
              <div className="pointer-events-none absolute inset-x-8 top-1/2 h-32 -translate-y-1/2 rounded-xl border-2 border-red-500 shadow-[0_0_0_999px_rgba(0,0,0,0.28)]">
                <span className="absolute inset-x-4 top-1/2 h-0.5 bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.9)]" />
              </div>
            </div>
            <button type="button" className="min-h-12 w-full bg-racing-red px-4 font-black" onClick={stopCamera}>
              Fechar scanner
            </button>
          </div>
        </div>
      ) : null}

      {!open && message ? <span className="sr-only" role="status">{message}</span> : null}
    </>
  );
}
