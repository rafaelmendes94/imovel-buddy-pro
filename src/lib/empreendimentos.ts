import { supabase } from "@/integrations/supabase/client";

/**
 * Fonte única de verdade para o cadastro de empreendimentos.
 * Edifício vertical  -> public.edificios
 * Condomínio horiz.  -> public.condominios
 * Loteamento         -> public.empreendimentos (tipo = 'Loteamento')
 */
export type EmpreendimentoTipo = "edificio" | "condominio" | "loteamento";

export const TIPO_TABLE: Record<EmpreendimentoTipo, "edificios" | "condominios" | "empreendimentos"> = {
  edificio: "edificios",
  condominio: "condominios",
  loteamento: "empreendimentos",
};

export const TIPO_LABEL: Record<EmpreendimentoTipo, string> = {
  edificio: "Edifício",
  condominio: "Condomínio horizontal",
  loteamento: "Loteamento",
};

export const TIPO_OPTIONS: { value: EmpreendimentoTipo; label: string }[] = [
  { value: "edificio", label: "Edifício vertical" },
  { value: "condominio", label: "Condomínio horizontal" },
  { value: "loteamento", label: "Loteamento" },
];

export interface EmpreendimentoInput {
  nome: string;
  construtora?: string;
  ano_construcao?: string;
  status?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  total_unidades?: number | null;
  descricao?: string;
  imagem_url?: string;
}

export interface EmpreendimentoRecord extends EmpreendimentoInput {
  id: string;
  tipo: EmpreendimentoTipo;
  user_id?: string | null;
}

const toNumber = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

const clean = (v?: string | null) => (v ?? "").toString().trim();

function mapRow(row: any, tipo: EmpreendimentoTipo): EmpreendimentoRecord {
  return {
    id: row.id,
    tipo,
    nome: row.nome || "",
    construtora: row.construtora || "",
    ano_construcao: row.ano_construcao || "",
    status: row.status || "",
    cep: row.cep || "",
    endereco: row.endereco || "",
    numero: row.numero || "",
    complemento: row.complemento || "",
    bairro: row.bairro || "",
    cidade: row.cidade || "",
    estado: row.estado || "",
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    total_unidades: row.total_unidades ?? null,
    descricao: row.descricao || "",
    imagem_url: row.imagem_url || "",
    user_id: row.user_id ?? null,
  };
}

const SELECT_COLS =
  "id, nome, endereco, numero, complemento, bairro, cidade, estado, cep, latitude, longitude, construtora, total_unidades, imagem_url, user_id";

/** Busca unificada por nome, endereço ou bairro nas três estruturas. */
export async function searchEmpreendimentos(term: string, limit = 12): Promise<EmpreendimentoRecord[]> {
  const t = clean(term);
  const tipos: EmpreendimentoTipo[] = ["edificio", "condominio", "loteamento"];

  const results = await Promise.all(
    tipos.map(async (tipo) => {
      let query = supabase.from(TIPO_TABLE[tipo]).select(SELECT_COLS).order("nome").limit(limit);
      if (t) {
        const like = `%${t}%`;
        query = query.or(`nome.ilike.${like},endereco.ilike.${like},bairro.ilike.${like},cidade.ilike.${like}`);
      }
      const { data, error } = await query;
      if (error || !data) return [] as EmpreendimentoRecord[];
      return (data as any[]).map((row) => mapRow(row, tipo));
    })
  );

  return results.flat().sort((a, b) => a.nome.localeCompare(b.nome)).slice(0, limit * 2);
}

const normName = (v: string) =>
  clean(v)
    .toLowerCase()
    .replace(/^(?:ed(?:if[ií]cio)?|res(?:idencial)?|cond(?:om[ií]nio)?|lot(?:eamento)?)\s*\.?\s*/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Encontra um empreendimento já cadastrado pelo nome (usado pelo cadastro por IA),
 * para herdar o endereço oficial em vez do endereço vindo do texto.
 */
export async function findEmpreendimentoByName(
  name: string,
  preferredTipos: readonly EmpreendimentoTipo[] = [],
): Promise<EmpreendimentoRecord | null> {
  const target = normName(name);
  if (target.length < 3) return null;

  const candidates = await searchEmpreendimentos(clean(name), 12);
  if (!candidates.length) return null;
  const ordered = preferredTipos.length
    ? [...candidates].sort((a, b) => {
        const ai = preferredTipos.indexOf(a.tipo);
        const bi = preferredTipos.indexOf(b.tipo);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      })
    : candidates;

  const exact = ordered.find((c) => normName(c.nome) === target);
  if (exact) return exact;

  const partial = ordered.find((c) => {
    const n = normName(c.nome);
    return n.length >= 3 && (n.includes(target) || target.includes(n));
  });
  return partial ?? null;
}

/** Campos de endereço do empreendimento que devem ter prioridade no imóvel. */
export function empreendimentoAddressFields(rec: EmpreendimentoRecord) {
  const out: Record<string, string> = {};
  const put = (k: string, v?: string | number | null) => {
    const val = v === null || v === undefined ? "" : String(v).trim();
    if (val) out[k] = val;
  };
  put("endereco", rec.endereco);
  put("numero", rec.numero);
  put("complemento", rec.complemento);
  put("bairro", rec.bairro);
  put("cidade", rec.cidade);
  put("estado", rec.estado);
  put("cep", rec.cep);
  put("latitude", rec.latitude as any);
  put("longitude", rec.longitude as any);
  return out;
}

export async function getEmpreendimentoById(
  tipo: EmpreendimentoTipo,
  id: string
): Promise<EmpreendimentoRecord | null> {
  const { data, error } = await supabase.from(TIPO_TABLE[tipo]).select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapRow(data, tipo);
}

/** Validação em português — usada pelo modal e pelas páginas centrais. */
export function validateEmpreendimento(input: EmpreendimentoInput): string | null {
  if (!clean(input.nome)) return "Informe o nome do empreendimento.";
  if (clean(input.nome).length < 3) return "O nome deve ter pelo menos 3 caracteres.";
  const lat = toNumber(input.latitude);
  const lng = toNumber(input.longitude);
  if (lat !== null && (lat < -90 || lat > 90)) return "Latitude inválida.";
  if (lng !== null && (lng < -180 || lng > 180)) return "Longitude inválida.";
  return null;
}

function buildPayload(tipo: EmpreendimentoTipo, input: EmpreendimentoInput) {
  const base: Record<string, any> = {
    nome: clean(input.nome),
    endereco: clean(input.endereco) || null,
    numero: clean(input.numero) || null,
    complemento: clean(input.complemento) || null,
    bairro: clean(input.bairro) || null,
    cidade: clean(input.cidade) || null,
    estado: clean(input.estado) || null,
    cep: clean(input.cep) || null,
    latitude: toNumber(input.latitude),
    longitude: toNumber(input.longitude),
    construtora: clean(input.construtora) || null,
    total_unidades: input.total_unidades ?? null,
    descricao: clean(input.descricao) || null,
    imagem_url: clean(input.imagem_url) || null,
  };

  if (tipo === "edificio") {
    base.ano_construcao = clean(input.ano_construcao) || null;
    base.status = clean(input.status) || "Pronto";
  } else if (tipo === "condominio") {
    base.ano_construcao = clean(input.ano_construcao) || null;
    base.tipo = "Condomínio horizontal";
  } else {
    base.status = clean(input.status) || "Em vendas";
    base.tipo = "Loteamento";
  }

  // Remove chaves vazias para não sobrescrever dados existentes com null em updates parciais
  return base;
}

function friendlyError(message: string): string {
  const m = (message || "").toLowerCase();
  if (m.includes("row-level security") || m.includes("permission"))
    return "Você não tem permissão para salvar este empreendimento.";
  if (m.includes("duplicate")) return "Já existe um empreendimento com estes dados.";
  return message || "Não foi possível salvar o empreendimento.";
}

/** Cria ou atualiza um empreendimento na tabela correta e retorna o registro salvo. */
export async function saveEmpreendimento(
  tipo: EmpreendimentoTipo,
  input: EmpreendimentoInput,
  editId?: string
): Promise<EmpreendimentoRecord> {
  const validation = validateEmpreendimento(input);
  if (validation) throw new Error(validation);

  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) throw new Error("Faça login para cadastrar um empreendimento.");

  const payload = buildPayload(tipo, input);
  const table = supabase.from(TIPO_TABLE[tipo]) as any;

  if (editId) {
    const { data, error } = await table.update(payload).eq("id", editId).select("*").maybeSingle();
    if (error) throw new Error(friendlyError(error.message));
    if (!data) throw new Error("Empreendimento não encontrado ou sem permissão para editar.");
    return mapRow(data, tipo);
  }

  const { data, error } = await table
    .insert([{ ...payload, user_id: user.id }])
    .select("*")
    .maybeSingle();
  if (error) throw new Error(friendlyError(error.message));
  if (!data) throw new Error("O empreendimento não foi gravado. Tente novamente.");
  return mapRow(data, tipo);
}

/** Colunas de vínculo do imóvel para cada tipo. */
export function linkColumns(record: EmpreendimentoRecord | null) {
  return {
    edificio_id: record?.tipo === "edificio" ? record.id : null,
    condominio_id: record?.tipo === "condominio" ? record.id : null,
    empreendimento_id: record?.tipo === "loteamento" ? record.id : null,
    empreendimento: record?.nome ?? "",
  };
}

export function tipoFromImovel(imovel: {
  edificio_id?: string | null;
  condominio_id?: string | null;
  empreendimento_id?: string | null;
}): { tipo: EmpreendimentoTipo; id: string } | null {
  if (imovel.edificio_id) return { tipo: "edificio", id: imovel.edificio_id };
  if (imovel.condominio_id) return { tipo: "condominio", id: imovel.condominio_id };
  if (imovel.empreendimento_id) return { tipo: "loteamento", id: imovel.empreendimento_id };
  return null;
}
