import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FIELDS = {
  titulo: { type: "string", description: "Título comercial curto do imóvel" },
  tipo: { type: "string", description: "Tipo: Apartamento, Casa, Cobertura, Terreno, Sala Comercial, Sobrado, etc." },
  status: { type: "string", description: "Disponível, Vendido ou Reservado" },
  cep: { type: "string" },
  endereco: { type: "string", description: "Rua/avenida sem número" },
  numero: { type: "string" },
  complemento: { type: "string" },
  bairro: { type: "string" },
  cidade: { type: "string" },
  estado: { type: "string", description: "Sigla UF, ex: RS" },
  empreendimento: { type: "string", description: "Nome do edifício/condomínio/loteamento" },
  unidade: { type: "string" },
  box: { type: "string", description: "Box/garagem" },
  quadra: { type: "string" },
  lote: { type: "string" },
  preco: { type: "number", description: "Valor de venda em reais, apenas número" },
  precoParcelado: { type: "number" },
  comissao: { type: "number", description: "Comissão em %" },
  bonus: { type: "number" },
  area: { type: "number", description: "Área total em m2" },
  areaPrivativa: { type: "number", description: "Área privativa em m2" },
  quartos: { type: "integer", description: "Dormitórios (0 a 10)" },
  suites: { type: "integer", description: "Suítes (0 a 10)" },
  banheiros: { type: "integer" },
  lavabo: { type: "integer" },
  vagas: { type: "integer" },
  elevadores: { type: "integer" },
  descricao: { type: "string", description: "Descrição comercial do imóvel, bem escrita" },
  proprietario: { type: "string" },
  proprietarioTelefone: { type: "string" },
  condicao: { type: "string", description: "Novo, Usado, Em construção, Na planta" },
  padrao: { type: "string", description: "Alto, Médio, Padrão, Luxo" },
  posicaoPredio: { type: "string", description: "Frente, Fundos, Lateral" },
  posicaoSolar: { type: "string", description: "Norte, Sul, Leste, Oeste" },
  vista: { type: "string", description: "Ex: Mar, Cidade, Lagoa" },
  localChaves: { type: "string" },
  vistaMar: { type: "boolean" },
  decorado: { type: "boolean" },
  aceitaPermuta: { type: "boolean" },
  condicoesPagemento: { type: "array", items: { type: "string" }, description: "Ex: Financiamento, À vista, Permuta, Parcelado direto" },
  infraestrutura: { type: "array", items: { type: "string" }, description: "Itens do prédio/condomínio: Piscina, Academia, Salão de festas, Churrasqueira..." },
  outrasCaracteristicas: { type: "array", items: { type: "string" }, description: "Ex: Sacada, Churrasqueira na sacada, Mobiliado, Ar condicionado" },
  linkVideo: { type: "string" },
  link360: { type: "string" },
} as const;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length < 10) {
      return new Response(JSON.stringify({ error: "Envie um texto com as informações do imóvel." }), {
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
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "Você extrai dados estruturados de anúncios/textos de imóveis brasileiros para preencher um formulário de CRM imobiliário. " +
              "Preencha SOMENTE os campos que estiverem claramente presentes ou fortemente implícitos no texto. " +
              "Nunca invente valores, telefones, endereços ou preços. Omita campos desconhecidos. " +
              "Valores monetários e áreas em número puro (ex: 850000, 92.5). Textos em português do Brasil.",
          },
          { role: "user", content: text.slice(0, 12000) },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "preencher_imovel",
              description: "Preenche os campos do cadastro de imóvel identificados no texto.",
              parameters: {
                type: "object",
                properties: FIELDS,
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "preencher_imovel" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao analisar o texto." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const fields = args ? JSON.parse(args) : {};

    return new Response(JSON.stringify({ fields }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-imovel-ia error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
