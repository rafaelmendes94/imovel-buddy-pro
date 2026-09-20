const strip = (value: string) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const PROPERTY_TYPE_OPTIONS = [
  "Apartamento",
  "Casa",
  "Casa em condomínio",
  "Comercial",
  "Terreno",
  "Lote",
  "Lote em condomínio",
  "Condomínio",
  "Sítio",
] as const;

export type PropertyTypeOption = (typeof PROPERTY_TYPE_OPTIONS)[number];

export function normalizePropertyType(value?: string | null): string {
  const raw = strip(value || "");
  if (!raw) return "Apartamento";

  if (raw.includes("apart") || raw === "ap" || raw === "apto") return "Apartamento";
  if (raw.includes("casa") && raw.includes("cond")) return "Casa em condomínio";
  if (raw.includes("lote") && raw.includes("cond")) return "Lote em condomínio";
  if (raw.includes("terreno")) return "Terreno";
  if (raw.includes("lote")) return "Lote";
  if (raw.includes("condominio") && !raw.includes("casa") && !raw.includes("lote")) return "Condomínio";
  if (raw.includes("sitio") || raw.includes("chacara") || raw.includes("fazenda")) return "Sítio";
  if (raw.includes("comercial") || raw.includes("sala") || raw.includes("loja")) return "Comercial";
  if (raw.includes("casa") || raw.includes("sobrado")) return "Casa";

  const exact = PROPERTY_TYPE_OPTIONS.find((option) => strip(option) === raw);
  return exact || value?.trim() || "Apartamento";
}

export function usesQuadraLote(tipo?: string | null) {
  const normalized = normalizePropertyType(tipo);
  return ["Casa em condomínio", "Lote", "Lote em condomínio", "Condomínio", "Terreno", "Sítio"].includes(normalized);
}

export function usesUnidade(tipo?: string | null) {
  const normalized = normalizePropertyType(tipo);
  return ["Apartamento", "Comercial"].includes(normalized);
}

export function usesNumero(tipo?: string | null) {
  const normalized = normalizePropertyType(tipo);
  return ["Casa", "Comercial", "Terreno", "Sítio"].includes(normalized);
}

export function normalizePropertyLocationByType<T extends Record<string, any>>(input: T) {
  const tipo = normalizePropertyType(input.tipo);
  const out = {
    ...input,
    tipo,
    unidade: String(input.unidade || "").trim(),
    numero: String(input.numero || "").trim(),
    quadra: String(input.quadra || "").trim(),
    lote: String(input.lote || "").trim(),
    complemento: String(input.complemento || "").trim(),
  };

  if (!usesUnidade(tipo)) out.unidade = "";
  if (!usesNumero(tipo)) out.numero = "";
  if (!usesQuadraLote(tipo)) {
    out.quadra = "";
    out.lote = "";
  }

  return out;
}

export function preferredEmpreendimentoTiposForPropertyType(tipo?: string | null) {
  const normalized = normalizePropertyType(tipo);
  if (normalized === "Apartamento" || normalized === "Comercial") return ["edificio", "empreendimento"];
  if (["Casa em condomínio", "Lote em condomínio", "Condomínio"].includes(normalized)) return ["condominio", "empreendimento"];
  return ["empreendimento", "condominio", "edificio"];
}
