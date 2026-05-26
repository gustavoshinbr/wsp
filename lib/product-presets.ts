export const productImagePresets = [
  { name: "Óleo 10W40", url: "/product-presets/oleo-10w40.svg" },
  { name: "Pastilha de freio", url: "/product-presets/pastilha-freio.svg" },
  { name: "Filtro de óleo", url: "/product-presets/filtro-oleo.svg" },
  { name: "Pneu esportivo", url: "/product-presets/pneu-esportivo.svg" },
  { name: "Vela de ignição", url: "/product-presets/vela-ignicao.svg" },
  { name: "Bateria", url: "/product-presets/bateria-moto.svg" },
];

export function isValidPresetImage(url: string) {
  return productImagePresets.some((preset) => preset.url === url);
}
