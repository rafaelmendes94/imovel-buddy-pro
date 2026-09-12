/**
 * BETA — Importação de imóveis a partir de uma tabela em PDF.
 * Fluxo isolado: extração de texto no navegador (pdf.js) → IA em lote → revisão → importação.
 * Nada é gravado sem confirmação explícita do corretor.
 */

import { supabase } from "@/integrations/supabase/client";
import { cleanBox, cleanUnidade, normalizePosicaoSolar, titleCase } from "@/lib/importMvImoveis";

export interface PdfPageText {
  page: number;
  text: string;
}

const txt = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());
const int = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
};
const dec = (v: unknown) => {
  if (typeof v === "number") return Number.isFinite(v) && v > 0 ? v : 0;
  const s = txt(v).replace(/[^\d,.-]/g, "");
  if (!s) return 0;
  // "33,35" → 33.35 · "1.803.000" → 1803000 · "1.234,56" → 1234.56
  const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  const n = Number(normalized);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/* ------------------------------------------------------------------ PDF.js */

let pdfjsPromise: Promise<any> | null = null;

async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import("pdfjs-dist");
      const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}

/** Extrai o texto de todas as páginas e miniaturas de referência (não são salvas como foto). */
export async function readPdf(
  file: File,
  onProgress?: (done: number, total: number) => void,
): Promise<{ pages: PdfPageText[]; thumbs: Record<number, string> }> {
  const pdfjs = await getPdfjs();
  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: PdfPageText[] = [];
  const thumbs: Record<number, string> = {};

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((it: any) => (typeof it.str === "string" ? it.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push({ page: i, text });

    if (i <= 40) {
      try {
        const viewport = page.getViewport({ scale: 0.45 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          await page.render({ canvas, canvasContext: ctx, viewport }).promise;
          thumbs[i] = canvas.toDataURL("image/jpeg", 0.6);
        }
      } catch {
        /* miniatura é opcional */
      }
    }
    onProgress?.(i, doc.numPages);
  }

  return { pages, thumbs };
}

/** Agrupa páginas em blocos de texto para enviar à IA (uma página pode ter vários imóveis). */
export function chunkPages(pages: PdfPageText[], maxChars = 14000): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const p of pages) {
    const block = `\n=== PÁGINA ${p.page} ===\n${p.text}\n`;
    if (current && current.length + block.length > maxChars) {
      chunks.push(current);
      current = "";
    }
    current += block;
  }
  if (current.trim()) chunks.push(current);
  return chunks;
}

/* --------------------------------------------------------------- IA em lote */

export interface AiImovel {
  pagina?: number;
  titulo?: string;
  empreendimento?: string;
  tipo?: string;
  unidade?: string;
  quadra?: string;
  lote?: string;
  box?: string;
  cidade?: string;
  bairro?: string;
  endereco?: string;
  numero?: string;
  estado?: string;
  preco?: number;
  quartos?: number;
  suites?: number;
  banheiros?: number;
  vagas?: number;
  area?: number;
  area_privativa?: number;
  posicao_solar?: string;
  mobiliado?: boolean;
  decorado?: boolean;
  aceita_financiamento?: boolean;
  aceita_permuta?: boolean;
  condicoes_pagamento?: string[];
  descricao?: string;
  vendido?: boolean;
  proprietario?: string;
  proprietario_telefone?: string;
  dados_insuficientes?: boolean;
}

export async function extractImoveisFromChunk(text: string): Promise<AiImovel[]> {
  const { data, error } = await supabase.functions.invoke("parse-tabela-pdf-ia", { body: { text } });
  if (error) {
    let msg = error.message || "Erro ao analisar a tabela";
    const ctx: any = (error as any).context;
    if (ctx?.json) {
      try {
        const j = await ctx.json();
        if (j?.error) msg = j.error;
      } catch {
        /* ignore */
      }
    }
    throw new Error(msg);
  }
  const list = (data as any)?.imoveis;
  return Array.isArray(list) ? list : [];
}

/* ------------------------------------------------------- Normalização MV */

const EMP_PREFIX = /^(ed\.?|edif[íi]cio|res(idencial)?\.?|cond(om[íi]nio)?\.?|lot(eamento)?\.?)\s+/i;
const QUADRA_LOTE_TIPOS = ["Casa", "Sobrado", "Terreno", "Lote", "Condomínio"];

/** "Ed. Paris Palace 607" → { empreendimento: "Paris Palace", unidade: "607" } */
function splitEmpreendimentoUnidade(raw: string) {
  let s = txt(raw).replace(EMP_PREFIX, "").trim();
  let unidade = "";
  const m = s.match(/\s(\d{1,5}[A-Za-z]?)$/);
  if (m) {
    unidade = m[1];
    s = s.slice(0, m.index).trim();
  }
  return { empreendimento: s, unidade };
}

/** "J-09" / "Q06/L44" / "QUADRA 6 LOTE 44" → quadra + lote */
export function parseQuadraLote(raw: string) {
  const s = txt(raw)
    .replace(/\bQ(UADRA|D)?\s*[:.\-]?\s*/i, "")
    .replace(/\bL(OTE|T)?\s*[:.\-]?\s*/i, "-")
    .replace(/[-/\s]+/g, "-")
    .replace(/^-|-$/g, "");
  const m = s.match(/^([A-Za-z]{1,3}|\d{1,3})-(\d{1,4}[A-Za-z]?)$/);
  return m ? { quadra: m[1].toUpperCase(), lote: m[2] } : { quadra: "", lote: "" };
}

/** Referência que claramente é quadra/lote e nunca unidade. */
const looksLikeQuadraLote = (s: string) =>
  /^(Q(UADRA|D)?\s*[:.\-]?\s*)?[A-Za-z0-9]{1,3}\s*[-/ ]\s*(L(OTE|T)?\s*[:.\-]?\s*)?\d{1,4}[A-Za-z]?$/i.test(s) &&
  /[-/ ]/.test(s);

export interface NormalizedImovel {
  titulo: string;
  tipo: string;
  status: string;
  empreendimento: string;
  unidade: string;
  quadra: string;
  lote: string;
  box: string;
  cidade: string;
  bairro: string;
  endereco: string;
  numero: string;
  estado: string;
  preco: number;
  quartos: number;
  suites: number;
  banheiros: number;
  vagas: number;
  area: number;
  area_privativa: number;
  posicao_solar: string;
  mobiliado: boolean;
  decorado: boolean;
  aceita_permuta: boolean;
  condicoes_pagamento: string[];
  descricao: string;
  proprietario: string;
  proprietario_telefone: string;
}

export function normalizeAiImovel(ai: AiImovel): NormalizedImovel {
  const tipo = txt(ai.tipo) || "Apartamento";
  const quadraLoteTipo = QUADRA_LOTE_TIPOS.includes(tipo);

  let empreendimento = txt(ai.empreendimento).replace(EMP_PREFIX, "").trim();
  let unidade = cleanUnidade(txt(ai.unidade));
  let quadra = txt(ai.quadra).toUpperCase();
  let lote = txt(ai.lote);

  // Quadra/lote nunca podem virar unidade.
  if (!quadra && !lote && unidade && looksLikeQuadraLote(unidade)) {
    const q = parseQuadraLote(unidade);
    if (q.quadra) {
      quadra = q.quadra;
      lote = q.lote;
      unidade = "";
    }
  }
  if (quadraLoteTipo && (quadra || lote)) unidade = "";

  // Unidade colada no nome do empreendimento ("Paris Palace 607").
  if (!unidade && !quadra && !lote && empreendimento) {
    const split = splitEmpreendimentoUnidade(empreendimento);
    if (split.unidade && !quadraLoteTipo) {
      empreendimento = split.empreendimento;
      unidade = split.unidade;
    }
  }

  const boxNums = cleanBox(txt(ai.box))
    .split(/\s*(?:,|\/|\be\b|\+|&)\s*/i)
    .map((b) => b.trim())
    .filter((b) => /^\d{1,4}[A-Za-z]?$/.test(b));
  const box = boxNums.join(" e ");
  const vagas = int(ai.vagas) || boxNums.length;

  const cidade = titleCase(txt(ai.cidade));
  const bairro = titleCase(txt(ai.bairro));
  const numero = txt(ai.numero);
  const rua = txt(ai.endereco);
  const endereco = [rua, numero].filter(Boolean).join(", ");

  const cond = new Set((ai.condicoes_pagamento || []).map((c) => txt(c)).filter(Boolean));
  if (ai.aceita_financiamento) cond.add("Financiamento");
  if (ai.aceita_permuta) cond.add("Permuta");

  const titulo =
    txt(ai.titulo) ||
    [empreendimento || rua || cidade, unidade || (quadra ? `Q${quadra}/L${lote}` : "") || numero]
      .filter(Boolean)
      .join(" ") ||
    "Imóvel importado (revisar)";

  return {
    titulo,
    tipo,
    status: ai.vendido ? "Vendido" : "Disponível",
    empreendimento,
    unidade,
    quadra,
    lote,
    box,
    cidade,
    bairro,
    endereco,
    numero,
    estado: txt(ai.estado).toUpperCase().slice(0, 2),
    preco: dec(ai.preco),
    quartos: int(ai.quartos),
    suites: int(ai.suites),
    banheiros: int(ai.banheiros),
    vagas,
    area: dec(ai.area),
    area_privativa: dec(ai.area_privativa),
    posicao_solar: normalizePosicaoSolar(ai.posicao_solar),
    mobiliado: !!ai.mobiliado,
    decorado: !!ai.decorado,
    aceita_permuta: !!ai.aceita_permuta,
    condicoes_pagamento: Array.from(cond),
    descricao: txt(ai.descricao),
    proprietario: txt(ai.proprietario),
    proprietario_telefone: txt(ai.proprietario_telefone),
  };
}

/** Chave de duplicidade: empreendimento+unidade, condomínio+quadra+lote ou endereço+número. */
export function dupeKeys(n: NormalizedImovel): string[] {
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  const keys: string[] = [];
  if (n.empreendimento && n.unidade) keys.push(`E:${norm(n.empreendimento)}|U:${norm(n.unidade)}`);
  if (n.empreendimento && (n.quadra || n.lote)) keys.push(`E:${norm(n.empreendimento)}|Q:${norm(n.quadra)}|L:${norm(n.lote)}`);
  if (n.endereco && n.numero) keys.push(`A:${norm(n.endereco)}|N:${norm(n.numero)}`);
  return keys;
}

/** Itens sem dados mínimos para virar cadastro. */
export function completeness(n: NormalizedImovel) {
  const missing: string[] = [];
  if (!n.titulo || n.titulo === "Imóvel importado (revisar)") missing.push("título");
  if (!n.cidade) missing.push("cidade");
  if (n.preco <= 0) missing.push("preço");
  if (!n.tipo) missing.push("tipo");
  return { ok: missing.length === 0, missing };
}

/** Payload final. O vínculo do corretor é sempre derivado do usuário autenticado. */
export function buildImovelPayload(n: NormalizedImovel, ownerId: string, ownerName?: string | null) {
  return {
    user_id: ownerId,
    corretor_id: ownerId,
    corretor_nome: ownerName || null,
    titulo: n.titulo || "Imóvel importado (revisar)",
    tipo: n.tipo || "Apartamento",
    status: n.status || "Disponível",
    finalidade: "Venda",
    empreendimento: n.empreendimento || null,
    unidade: n.unidade || null,
    quadra: n.quadra || null,
    lote: n.lote || null,
    box: n.box || null,
    cidade: n.cidade || "A definir",
    bairro: n.bairro || null,
    endereco: n.endereco || "A definir",
    numero: n.numero || null,
    estado: n.estado || null,
    preco: n.preco,
    quartos: n.quartos,
    suites: n.suites,
    banheiros: n.banheiros,
    lavabo: 0,
    vagas: n.vagas,
    area: n.area,
    area_privativa: n.area_privativa,
    posicao_solar: n.posicao_solar || null,
    mobiliado: n.mobiliado,
    decorado: n.decorado,
    aceita_permuta: n.aceita_permuta,
    vista_mar: false,
    condicoes_pagamento: n.condicoes_pagamento,
    descricao: n.descricao || null,
    proprietario: n.proprietario || null,
    proprietario_telefone: n.proprietario_telefone || null,
    imagens: [] as string[],
    ativo_site: false,
    publicar_xml: false,
    destaque_home: false,
  };
}
