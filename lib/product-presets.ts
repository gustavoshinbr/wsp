export const productImagePresets = [
  { name: "Oleo 10W30", url: "/product-presets/oleo-10w30.svg" },
  { name: "Oleo 20W50", url: "/product-presets/oleo-20w50.svg" },
  { name: "Oleo 15W40", url: "/product-presets/oleo-15w40.svg" },
  { name: "Oleo 5W30", url: "/product-presets/oleo-5w30.svg" },
  { name: "Relacao / corrente", url: "/product-presets/relacao-corrente.svg" },
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
