import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  tipo: { type: "string", description: "Apartamento, Casa, Sobrado, Cobertura, Terreno, Lote, Sala Comercial, Loft..." },
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
  "REGRAS: unidade só com o identificador, sem prefixos (AP/Apto/Apartamento). Quadra e lote vão em 'quadra'/'lote' e NUNCA em 'unidade'.",
  "'Q06/L44' => quadra '06', lote '44'. 'J-09' em loteamento/condomínio => quadra 'J', lote '09'. 'T22/205' em torre => empreendimento com torre T22 e unidade '205'.",
  "Casas de rua: número do endereço vai em 'numero', jamais em 'unidade'.",
  "Box: 'Box 88 + Box 89' => box '88 e 89' e vagas 2. 'sem box' => vagas 0 e box vazio. '1 vaga' => vagas 1 e box vazio.",
  "Valores: 'R$ 210.000' => 210000; 'R$ 1.803.000' => 1803000. Áreas: '33,35m²' => 33.35. Nunca multiplique nem divida por erro de separador.",
  "Se o texto marcar VENDIDO, defina vendido=true. Se for apenas uma listagem de vendidos sem dados suficientes, defina também dados_insuficientes=true.",
].join(" ");

serve(async (req) => {
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: text.slice(0, 60000) },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "registrar_imoveis",
              description: "Registra a lista de imóveis identificados na tabela em PDF.",
              parameters: {
                type: "object",
                properties: {
                  imoveis: {
                    type: "array",
                    items: { type: "object", properties: IMOVEL_FIELDS, additionalProperties: false },
                  },
                },
                required: ["imoveis"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "registrar_imoveis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições de IA. Aguarde alguns segundos e tente novamente." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos para continuar." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 403) {
        return new Response(JSON.stringify({ error: "Uso de IA bloqueado nas configurações do workspace." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao analisar a tabela em PDF." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    let imoveis: unknown[] = [];
    if (args) {
      try {
        const parsed = JSON.parse(args);
        if (Array.isArray(parsed?.imoveis)) imoveis = parsed.imoveis;
      } catch (e) {
        console.error("JSON parse error:", e);
      }
    }

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
});
