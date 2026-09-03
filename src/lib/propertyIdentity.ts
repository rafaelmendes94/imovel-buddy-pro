/**
 * Identificação automática do imóvel, montada conforme o tipo.
 *
 * Apartamento / Edifício  -> Empreendimento • Unidade 1002 • Box 1.11
 * Casa em condomínio      -> Condomínio • Quadra F01 • Lote 01
 * Terreno / Lote          -> Empreendimento • Quadra F01 • Lote 01
 *
 * Campos vazios são simplesmente omitidos (nunca "undefined", "null", "-"
 * ou "Não informado"). Somente leitura — nenhum campo do banco é alterado.
 */

export interface PropertyIdentityInput {
  tipo?: string | null;
  empreendimento?: string | null;
  unidade?: string | null;
  box?: string | null;
  quadra?: string | null;
  lote?: string | null;
  /** Número do endereço (imoveis.numero) — usado como unidade em imóveis de bairro. */
  numero?: string | null;
}

const clean = (value?: string | null): string => {
  const v = (value ?? "").toString().trim();
  if (!v) return "";
  const lower = v.toLowerCase();
  if (["-", "--", "null", "undefined", "n/a", "não informado", "nao informado"].includes(lower)) return "";
  return v;
};

const normalizeTipo = (tipo?: string | null) =>
  (tipo ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export type IdentityKind = "unidade" | "quadra-lote" | "comercial";

export function identityKind(tipo?: string | null): IdentityKind {
  const t = normalizeTipo(tipo);
  // Comercial: usa unidade (sala/loja) e, na falta, o número do endereço.
  if (
    t.includes("sala") || t.includes("loja") || t.includes("comerc") ||
    t.includes("conjunto") || t.includes("galpao") || t.includes("pavilhao") ||
    t.includes("escritorio")
  ) {
    return "comercial";
  }
  if (t.includes("apart") || t.includes("edific") || t.includes("flat") || t.includes("cobertura") || t.includes("studio")) {
    return "unidade";
  }
  if (t.includes("terreno") || t.includes("lote") || t.includes("casa") || t.includes("condomin") || t.includes("sobrado") || t.includes("chacara") || t.includes("sitio")) {
    return "quadra-lote";
  }
  return "unidade";
}

/** Retorna as partes da identificação, já filtradas e rotuladas. */
export function getPropertyIdentityParts(p: PropertyIdentityInput): string[] {
  const empreendimento = clean(p.empreendimento);
  const unidade = clean(p.unidade);
  const box = clean(p.box);
  const quadra = clean(p.quadra);
  const lote = clean(p.lote);
  const numero = clean(p.numero);

  const parts: string[] = [];
  if (empreendimento) parts.push(empreendimento);

  const kind = identityKind(p.tipo);

  if (kind === "unidade") {
    // Apartamento / edifício → sempre a unidade (nunca quadra/lote).
    if (unidade) parts.push(`Unidade ${unidade}`);
    if (box) parts.push(`Box ${box}`);
  } else if (kind === "comercial") {
    if (unidade) parts.push(`Unidade ${unidade}`);
    else if (numero) parts.push(`Unidade ${numero}`);
    if (box) parts.push(`Box ${box}`);
  } else {
    // Casa / sobrado / lote / terreno.
    if (quadra || lote) {
      if (quadra) parts.push(`Quadra ${quadra}`);
      if (lote) parts.push(`Lote ${lote}`);
    } else if (unidade) {
      parts.push(`Unidade ${unidade}`);
    } else if (numero) {
      // Imóvel de bairro → número do endereço.
      parts.push(`Unidade ${numero}`);
    }
    if (box) parts.push(`Box ${box}`);
  }

  return parts;
}

/** Linha única: "Edifício Beira Mar • Unidade 1002 • Box 1.11" */
export function getPropertyIdentity(p: PropertyIdentityInput): string {
  return getPropertyIdentityParts(p).join(" • ");
}

/** Partes sem o nome do empreendimento (útil quando ele já é exibido como link). */
export function getPropertyUnitParts(p: PropertyIdentityInput): string[] {
  return getPropertyIdentityParts({ ...p, empreendimento: "" });
}

/** Rótulo curto da unidade (sem empreendimento). "—" quando não há dado. */
export function getPropertyUnitLabel(p: PropertyIdentityInput): string {
  const parts = getPropertyUnitParts(p).filter((x) => !x.startsWith("Box "));
  if (parts.length === 0) return "—";
  return parts.join(" | ").replace(/^Unidade /, "Unidade ");
}
