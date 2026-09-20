import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { geminiJson } from "../_shared/gemini.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FIELDS = {
  titulo: { type: "string", description: "Título comercial curto do imóvel" },
  tipo: { type: "string", description: "Use somente: Apartamento, Casa, Casa em condominio, Lote, Lote em condominio." },
  status: { type: "string", description: "Disponível, Vendido ou Reservado" },
  cep: { type: "string" },
  endereco: { type: "string", description: "Rua/avenida sem número" },
  numero: { type: "string" },
  complemento: { type: "string" },
  bairro: { type: "string" },
  cidade: { type: "string" },
  estado: { type: "string", description: "Sigla UF, ex: RS" },
  empreendimento: { type: "string", description: "Nome do edifício/condomínio/loteamento" },
  unidade: {
    type: "string",
    description:
      "Identificador da unidade/apartamento SOMENTE com o número, sem prefixos. 'AP 1006' => '1006'; 'Apto 402' => '402'. Preserve letra apenas se fizer parte real do identificador (ex: '402B'). NUNCA use quadra/lote como unidade, nem o número do endereço da rua.",
  },
  box: {
    type: "string",
    description:
      "Número(s) do box/vaga/garagem identificados: 'box 76' => '76'; 'boxes 31 e 32' => '31 e 32'. Somente quando houver número específico do box. Quantidade de vagas ('2 vagas', '1 box') NÃO é box — deixe vazio e informe em 'vagas'.",
  },

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

export async function handler(req: Request) {
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

    const fields = await geminiJson<Record<string, unknown>>(
              "Você extrai dados estruturados de anúncios/textos de imóveis brasileiros para preencher um formulário de CRM imobiliário. " +
              "Preencha SOMENTE os campos que estiverem claramente presentes ou fortemente implícitos no texto. " +
              "Nunca invente valores, telefones, endereços ou preços. Omita campos desconhecidos. " +
              "Valores monetários e áreas em número puro (ex: 850000, 92.5). Textos em português do Brasil. " +
              "TIPO deve ser exatamente um destes: Apartamento, Casa, Casa em condominio, Lote, Lote em condominio. Terreno deve virar Lote. " +
              "REGRAS DE LOCALIZAÇÃO INTERNA: Apartamento usa somente unidade. Casa usa somente numero. Casa em condominio usa quadra e lote. Lote usa quadra e lote. Lote em condominio usa quadra, lote e numero. " +
              "Quadra e lote vão em 'quadra' e 'lote' (ex: 'Q11 L04' => quadra='11', lote='04') e NUNCA em 'unidade'. " +
              "'box 76', 'box nº 76', 'vaga 76', 'garagem 76' => box='76'; 'box 31 e 32' ou 'boxes 31/32' => box='31 e 32' e vagas=2. " +
              "Quantidade sem número do box ('1 box', '2 vagas') => box vazio e vagas com a quantidade. " +
              "Responda somente um objeto JSON válido com os campos identificados. Campos permitidos: " +
              Object.keys(FIELDS).join(", ") + ".",
      text.slice(0, 12000),
      { model: "gemini-2.5-flash", temperature: 0.1 },
    );

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
}

if (import.meta.main) serve(handler);
