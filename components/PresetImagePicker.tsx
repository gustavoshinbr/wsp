"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Preset = {
  name: string;
  url: string;
};

export function PresetImagePicker({ presets }: { presets: Preset[] }) {
  const [selected, setSelected] = useState("");

  return (
    <div className="space-y-2">
      <input type="hidden" name="presetImageUrl" value={selected} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black">Foto leve pré-carregada</p>
        {selected ? (
          <button type="button" className="text-xs font-black text-racing-red" onClick={() => setSelected("")}>
            Limpar
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.url}
            type="button"
            className={cn(
              "overflow-hidden rounded-lg border bg-racing-soft text-left",
              selected === preset.url ? "border-racing-red ring-2 ring-red-500/20" : "border-racing-line",
            )}
            onClick={() => setSelected(preset.url)}
          >
            <div className="relative aspect-[4/3]">
              <Image src={preset.url} alt={preset.name} fill className="object-cover" />
            </div>
            <span className="block truncate px-2 py-1.5 text-[11px] font-bold">{preset.name}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-racing-muted">Escolha uma imagem pronta ou envie uma foto abaixo.</p>
    </div>
  );
}
