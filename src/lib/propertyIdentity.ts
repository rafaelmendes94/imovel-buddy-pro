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

export type IdentityKind = "unidade" | "quadra-lote";

export function identityKind(tipo?: string | null): IdentityKind {
  const t = normalizeTipo(tipo);
  if (t.includes("apart") || t.includes("edific") || t.includes("flat") || t.includes("cobertura") || t.includes("studio")) {
    return "unidade";
  }
  if (t.includes("terreno") || t.includes("lote") || t.includes("casa") || t.includes("condomin") || t.includes("sobrado")) {
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

  const parts: string[] = [];
  if (empreendimento) parts.push(empreendimento);

  if (identityKind(p.tipo) === "unidade") {
    if (unidade) parts.push(`Unidade ${unidade}`);
    if (box) parts.push(`Box ${box}`);
    // fallback: se não houver unidade mas houver quadra/lote, ainda exibe
    if (!unidade && !box) {
      if (quadra) parts.push(`Quadra ${quadra}`);
      if (lote) parts.push(`Lote ${lote}`);
    }
  } else {
    if (quadra) parts.push(`Quadra ${quadra}`);
    if (lote) parts.push(`Lote ${lote}`);
    if (!quadra && !lote) {
      if (unidade) parts.push(`Unidade ${unidade}`);
      if (box) parts.push(`Box ${box}`);
    }
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
