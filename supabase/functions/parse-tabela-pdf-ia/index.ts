import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { geminiJson } from "../_shared/gemini.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Campos de cada imóvel do lote. NÃO existe corretor_id aqui — o vínculo é derivado do usuário logado. */
const IMOVEL_FIELDS = {
  pagina: { type: "integer", description: "Número da página do PDF onde este imóvel aparece" },
  titulo: { type: "string", description: "Título curto: empreendimento + unidade quando houver" },
  empreendimento: { type: "string", description: "Nome do edifício/condomínio/loteamento SEM prefixos 'Ed.', 'Edifício', 'Residencial' e SEM a unidade" },
  tipo: { type: "string", description: "Use somente: Apartamento, Casa, Casa em condominio, Lote, Lote em condominio. Terreno deve virar Lote." },
  unidade: {
    type: "string",
    description:
      "Somente o identificador da unidade, sem 'AP', 'Apto', 'Apartamento', 'unidade'. 'Ed. Paris Palace 607' => '607'; '608B' => '608B'. NUNCA use quadra/lote nem número da rua como unidade.",
  },
  quadra: { type: "string", description: "Quadra. 'Q06/L44' => '06'. 'J-09' em loteamento/condomínio => 'J'." },
  lote: { type: "string", description: "Lote. 'Q06/L44' => '44'. 'J-09' => '09'." },
  box: {
    type: "string",
    description:
      "Número(s) do box/vaga/garagem: 'Box 88 + Box 89' => '88 e 89'; 'box 76' => '76'. Quantidade sem número ('1 vaga', 'sem box') NÃO é box — deixe vazio.",
  },
  cidade: { type: "string" },
  bairro: { type: "string" },
  endereco: { type: "string", description: "Rua/avenida sem número" },
  numero: { type: "string", description: "Número do endereço da rua (casas/sobrados)" },
  estado: { type: "string", description: "Sigla UF quando informada" },
  preco: { type: "number", description: "Valor de venda em reais, apenas número. 'R$ 1.803.000' => 1803000" },
  quartos: { type: "integer", description: "Dormitórios" },
  suites: { type: "integer" },
  banheiros: { type: "integer" },
  vagas: { type: "integer", description: "Quantidade de vagas/box" },
  area: { type: "number", description: "Área total/terreno em m2 quando claramente informada. '33,35m²' => 33.35" },
  area_privativa: { type: "number", description: "Área privativa em m2" },
  posicao_solar: { type: "string", description: "Norte, Sul, Leste, Oeste" },
  mobiliado: { type: "boolean" },
  decorado: { type: "boolean" },
  aceita_financiamento: { type: "boolean" },
  aceita_permuta: { type: "boolean", description: "Aceita permuta/dação" },
  condicoes_pagamento: { type: "array", items: { type: "string" }, description: "Ex: Financiamento, À vista, Permuta, Parcelado direto" },
  descricao: { type: "string", description: "Resumo comercial curto com base APENAS no que está no PDF" },
  vendido: { type: "boolean", description: "true se o PDF marca este imóvel como VENDIDO" },
  proprietario: { type: "string" },
  proprietario_telefone: { type: "string" },
  dados_insuficientes: { type: "boolean", description: "true quando o item aparece apenas em lista (ex: página de vendidos) sem dados suficientes para cadastro" },
} as const;

const SYSTEM = [
  "Você extrai imóveis de TABELAS/CATÁLOGOS de imobiliárias brasileiras (texto extraído de PDF) para importação em lote num CRM.",
  "Retorne um ARRAY com UM item por imóvel. Uma página pode conter VÁRIOS imóveis (cards) e um imóvel pode ocupar várias páginas — use o contexto para separar corretamente.",
  "Nunca invente cidade, bairro, endereço, CEP, telefone, preço ou área. Omita o que não estiver no texto.",
  "TIPO deve ser exatamente um destes: Apartamento, Casa, Casa em condominio, Lote, Lote em condominio. Terreno deve virar Lote.",
  "REGRAS: Apartamento usa somente unidade. Casa usa somente numero. Casa em condominio usa quadra e lote. Lote usa quadra e lote. Lote em condominio usa quadra, lote e numero. Quadra e lote NUNCA vão em unidade.",
  "'Q06/L44' => quadra '06', lote '44'. 'J-09' em loteamento/condomínio => quadra 'J', lote '09'. 'T22/205' em torre => empreendimento com torre T22 e unidade '205'.",
  "Casas de rua: número do endereço vai em 'numero', jamais em 'unidade'.",
  "Box: 'Box 88 + Box 89' => box '88 e 89' e vagas 2. 'sem box' => vagas 0 e box vazio. '1 vaga' => vagas 1 e box vazio.",
  "Valores: 'R$ 210.000' => 210000; 'R$ 1.803.000' => 1803000. Áreas: '33,35m²' => 33.35. Nunca multiplique nem divida por erro de separador.",
  "Se o texto marcar VENDIDO, defina vendido=true. Se for apenas uma listagem de vendidos sem dados suficientes, defina também dados_insuficientes=true.",
].join(" ");

export async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length < 20) {
      return new Response(JSON.stringify({ error: "Envie o texto extraído do PDF." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = await geminiJson<{ imoveis?: unknown[] }>(
      SYSTEM +
        " Responda somente um objeto JSON válido no formato {\"imoveis\": []}. Campos permitidos em cada imóvel: " +
        Object.keys(IMOVEL_FIELDS).join(", ") +
        ".",
      text.slice(0, 60000),
      { model: "gemini-2.5-pro", temperature: 0.1 },
    );
    const imoveis = Array.isArray(parsed?.imoveis) ? parsed.imoveis : [];

    return new Response(JSON.stringify({ imoveis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-tabela-pdf-ia error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

if (import.meta.main) serve(handler);
