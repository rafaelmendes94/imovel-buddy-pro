// Normalização de UNIDADE e BOX extraídos pela IA (ou do texto bruto) no cadastro de imóveis.

const UNIT_PREFIX = /^(?:ap(?:to?|artamento)?|unid(?:ade)?s?|un|sala|conj(?:unto)?)\s*\.?\s*n?[ºo°]?\s*/i;

const HOUSE_TYPES = /(casa|sobrado|terreno|lote|loteamento|chácara|chacara|sítio|sitio)/i;

/** "AP 1006" -> "1006"; "Apto 402-B" -> "402-B" */
export function normalizeUnidade(raw: unknown, tipo?: string): string {
  if (raw === null || raw === undefined) return '';
  let v = String(raw).trim();
  if (!v) return '';
  v = v.replace(UNIT_PREFIX, '').trim();
  v = v.replace(/^n?[ºo°]\s*/i, '').trim();
  // Não aceitar quadra/lote como unidade
  if (/^q(uadra)?\s*\.?\s*\d+/i.test(v) || /^l(ote)?\s*\.?\s*\d+/i.test(v)) return '';
  if (/\bq(uadra)?\s*\d+\b/i.test(v) && /\bl(ote)?\s*\d+\b/i.test(v)) return '';
  // Casa/lote/terreno: só manter unidade se for claramente numérica curta e informada
  if (tipo && HOUSE_TYPES.test(tipo) && !/^\d{1,5}[A-Za-z]?$/.test(v)) return '';
  return v;
}

function splitBoxNumbers(s: string): string[] {
  return s
    .split(/\s*(?:,|\/|\be\b|-|&)\s*/i)
    .map(x => x.trim())
    .filter(x => /^\d{1,4}[A-Za-z]?$/.test(x));
}

/** "box 31 e 32" / "31/32" -> "31 e 32" */
export function normalizeBox(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  let v = String(raw).trim();
  if (!v) return '';
  v = v.replace(/\b(?:box(?:es)?|vaga(?:s)?|garagem|garagens)\b/gi, ' ')
       .replace(/n?[ºo°]/gi, ' ')
       .trim();
  const nums = splitBoxNumbers(v);
  if (nums.length === 0) return '';
  return nums.join(' e ');
}

export interface UnitBoxExtraction {
  unidade?: string;
  box?: string;
  vagas?: number;
}

/** Fallback: lê unidade/box/vagas direto do texto colado. */
export function extractUnitBoxFromText(text: string, tipo?: string): UnitBoxExtraction {
  const out: UnitBoxExtraction = {};
  const t = text || '';

  const unitMatch = t.match(
    /\b(?:ap(?:to?|artamento)?|unid(?:ade)?|un)\s*\.?\s*n?[ºo°]?\s*(\d{1,5}[A-Za-z]?)\b/i,
  );
  if (unitMatch) {
    const u = normalizeUnidade(unitMatch[1], tipo);
    if (u) out.unidade = u;
  }

  // box identificado por número APÓS a palavra (evita "2 vagas" = quantidade)
  const boxMatch = t.match(
    /\b(?:box(?:es)?|vaga(?:s)?|garagem|garagens)\s*(?:n?[ºo°]\s*)?(\d{1,4}[A-Za-z]?(?:\s*(?:,|\/|e|&)\s*\d{1,4}[A-Za-z]?)*)/i,
  );
  if (boxMatch) {
    const b = normalizeBox(boxMatch[1]);
    if (b) {
      out.box = b;
      const count = b.split(' e ').length;
      if (count > 1) out.vagas = count;
    }
  }

  // quantidade: "2 vagas", "1 box", "2 boxes"
  const qtyMatch = t.match(/\b(\d{1,2})\s*(?:box(?:es)?|vaga(?:s)?)\b/i);
  if (qtyMatch && out.vagas === undefined) {
    const n = Number(qtyMatch[1]);
    if (n > 0 && n <= 10) out.vagas = n;
  }

  return out;
}
