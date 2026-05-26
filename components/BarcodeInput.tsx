"use client";

import { ScanLine } from "lucide-react";
import { useRef, useState } from "react";

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>>;
};

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

export function BarcodeInput({
  name,
  defaultValue,
  placeholder = "Código de barras",
}: {
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue || "");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [message, setMessage] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  async function startCamera() {
    if (!("BarcodeDetector" in window)) {
      setMessage("Use um leitor USB/Bluetooth ou digite o código. A câmera depende do navegador.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setCameraOpen(true);
      setMessage("Aponte para o código e toque em Ler código.");
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 0);
    } catch {
      setMessage("Não foi possível abrir a câmera. O leitor físico continua funcionando neste campo.");
    }
  }

  async function readBarcode() {
    if (!videoRef.current || !window.BarcodeDetector) return;
    const detector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e"] });
    const result = await detector.detect(videoRef.current).catch(() => []);
    const code = result[0]?.rawValue;
    if (code) {
      setValue(code);
      setMessage("Código lido.");
      stopCamera();
    } else {
      setMessage("Código não encontrado. Tente aproximar ou melhorar a luz.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="h-11 rounded-lg px-3"
          placeholder={placeholder}
          inputMode="numeric"
        />
        <button
          type="button"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-racing-line px-3 text-sm font-black"
          onClick={cameraOpen ? readBarcode : startCamera}
          title="Ler código de barras"
        >
          <ScanLine size={17} />
          <span className="hidden sm:inline">{cameraOpen ? "Ler" : "Scanner"}</span>
        </button>
      </div>
      {cameraOpen ? (
        <div className="overflow-hidden rounded-lg border border-racing-line bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="h-40 w-full object-cover" />
          <button type="button" className="w-full bg-racing-red px-3 py-2 text-sm font-black text-white" onClick={stopCamera}>
            Fechar câmera
          </button>
        </div>
      ) : null}
      {message ? <p className="text-xs text-racing-muted">{message}</p> : null}
    </div>
  );
}
