import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { geminiJson } from "../_shared/gemini.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type CondoInput = Record<string, unknown>;

const allowedFields = [
  "nome",
  "construtora",
  "ano_construcao",
  "tipo",
  "cep",
  "endereco",
  "numero",
  "complemento",
  "bairro",
  "cidade",
  "estado",
  "total_unidades",
  "unidades_disponiveis",
  "taxa_condominio",
  "descricao",
  "amenidades",
  "latitude",
  "longitude",
] as const;

const compact = (value: unknown) => String(value ?? "").trim();
const onlyDigits = (value: unknown) => compact(value).replace(/\D/g, "");

const formatCep = (value: unknown) => {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : compact(value);
};

const titleCase = (value: unknown) =>
  compact(value)
    .toLocaleLowerCase("pt-BR")
    .replace(/\b([a-záàâãéêíóôõúç])([\wÀ-ÿ]*)/gi, (word, first, rest) => {
      const lower = word.toLocaleLowerCase("pt-BR");
      if (["da", "de", "do", "das", "dos", "e"].includes(lower)) return lower;
      return `${String(first).toLocaleUpperCase("pt-BR")}${String(rest)}`;
    });

const cleanObject = (fields: Record<string, unknown>) => {
  const out: Record<string, unknown> = {};
  for (const key of allowedFields) {
    const value = fields[key];
    if (value == null) continue;
    if (typeof value === "string" && !value.trim()) continue;
    if (Array.isArray(value) && !value.length) continue;
    out[key] = value;
  }
  return out;
};

async function viaCep(cep: string) {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) return {};
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!res.ok) return {};
    const json = await res.json();
    if (json?.erro) return {};
    return cleanObject({
      cep: formatCep(digits),
      endereco: json.logradouro,
      bairro: json.bairro,
      cidade: json.localidade,
      estado: json.uf,
    });
  } catch {
    return {};
  }
}

export async function handler(req: Request) {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { condominio } = await req.json();
    if (!condominio || typeof condominio !== "object") {
      return new Response(JSON.stringify({ error: "Envie os dados do condomínio." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const current = condominio as CondoInput;
    const cepFields = await viaCep(compact(current.cep));
    const base = cleanObject({
      ...current,
      ...Object.fromEntries(Object.entries(cepFields).filter(([key]) => !compact(current[key]))),
      cep: formatCep(current.cep || cepFields.cep),
      nome: titleCase(current.nome),
      endereco: titleCase(current.endereco || cepFields.endereco),
      bairro: titleCase(current.bairro || cepFields.bairro),
      cidade: titleCase(current.cidade || cepFields.cidade),
      estado: compact(current.estado || cepFields.estado).toLocaleUpperCase("pt-BR").slice(0, 2),
    });

    const fields = await geminiJson<Record<string, unknown>>(
      "Você revisa cadastros de condomínios brasileiros para um CRM imobiliário. " +
        "Padronize nomes, endereço, cidade, bairro, UF, CEP, tipo, descrição e amenidades. " +
        "Use ViaCEP quando informado no JSON. Não invente construtora, ano, total de unidades, taxa, coordenadas ou amenidades. " +
        "Preserve dados já preenchidos quando forem plausíveis. Retorne somente JSON válido com os campos permitidos.",
      JSON.stringify({ camposPermitidos: allowedFields, condominio: base }).slice(0, 12000),
      { model: "gemini-2.5-flash", temperature: 0.1 },
    );

    const cleaned = cleanObject({
      ...base,
      ...fields,
      cep: formatCep(fields.cep || base.cep),
      nome: titleCase(fields.nome || base.nome),
      endereco: titleCase(fields.endereco || base.endereco),
      bairro: titleCase(fields.bairro || base.bairro),
      cidade: titleCase(fields.cidade || base.cidade),
      estado: compact(fields.estado || base.estado).toLocaleUpperCase("pt-BR").slice(0, 2),
    });

    return new Response(JSON.stringify({ fields: cleaned, summary: "Cadastro analisado e padronizado." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-condominio-ia error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

if (import.meta.main) serve(handler);
