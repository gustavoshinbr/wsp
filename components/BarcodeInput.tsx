"use client";

import { useEffect, useRef, useState } from "react";
import { BarcodeScanner } from "@/components/BarcodeScanner";

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
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const form = wrapperRef.current?.closest("form");
    if (!form) return;
    const resetValue = () => setValue(defaultValue || "");
    form.addEventListener("reset", resetValue);
    return () => form.removeEventListener("reset", resetValue);
  }, [defaultValue]);

  return (
    <div ref={wrapperRef} className="flex gap-2">
      <input
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-11 rounded-lg px-3"
        placeholder={placeholder}
        inputMode="numeric"
      />
      <BarcodeScanner onDetected={setValue} />
    </div>
  );
}
