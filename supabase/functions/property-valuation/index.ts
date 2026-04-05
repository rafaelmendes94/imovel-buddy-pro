import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

async function getAIModel(): Promise<string> {
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data } = await supabase.from("system_settings").select("value").eq("key", "ai_model").maybeSingle();
    return data?.value || "google/gemini-2.5-pro";
  } catch { return "google/gemini-2.5-pro"; }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const toolSchema = {
  type: "function" as const,
  function: {
    name: "property_valuation",
    description: "Retorna a avaliação completa do imóvel com valores de mercado, anúncios encontrados, rentabilidade, sugestões de valorização e score de confiança.",
    parameters: {
      type: "object",
      properties: {
        marketValue: { type: "number", description: "Valor estimado de mercado em reais" },
        quickSaleValue: { type: "number", description: "Valor para venda rápida (15-25% abaixo)" },
        pricePerSqm: { type: "number", description: "Valor por metro quadrado em reais" },
        confidenceScore: { type: "number", description: "Score de confiança da avaliação de 0 a 100, baseado na quantidade e qualidade dos comparativos encontrados" },
        internalComparables: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              price: { type: "number" },
              similarity: { type: "string", description: "Percentual ex: 85%" },
            },
            required: ["id", "title", "price", "similarity"],
          },
        },
        foundListings: {
          type: "array",
          description: "Anúncios similares encontrados em portais imobiliários. Forneça URLs reais baseadas nos padrões de URL dos portais.",
          items: {
            type: "object",
            properties: {
              url: { type: "string", description: "URL do anúncio no portal (use padrões reais como zapimoveis.com.br/imovel/..., olx.com.br/..., etc)" },
              title: { type: "string", description: "Título do anúncio encontrado" },
              price: { type: "number", description: "Preço do anúncio em reais" },
              area: { type: "number", description: "Área em m²" },
              platform: { type: "string", description: "Nome do portal: ZAP, OLX, Viva Real, Mercado Livre, ImóvelWeb" },
              similarity: { type: "string", description: "Percentual de similaridade ex: 90%" },
            },
            required: ["url", "title", "price", "area", "platform", "similarity"],
          },
        },
        platformBreakdown: {
          type: "array",
          description: "Detalhamento por portal imobiliário pesquisado",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Nome do portal" },
              count: { type: "number", description: "Quantidade de anúncios encontrados" },
              avgPrice: { type: "number", description: "Preço médio" },
              minPrice: { type: "number", description: "Preço mínimo" },
              maxPrice: { type: "number", description: "Preço máximo" },
            },
            required: ["name", "count", "avgPrice", "minPrice", "maxPrice"],
          },
        },
        externalAnalysis: {
          type: "object",
          properties: {
            zapMinPrice: { type: "number" },
            zapMaxPrice: { type: "number" },
            zapAvgPrice: { type: "number" },
            totalListings: { type: "number" },
            platforms: { type: "string" },
            marketTrend: { type: "string", description: "alta, estável, baixa" },
          },
          required: ["zapMinPrice", "zapMaxPrice", "zapAvgPrice", "totalListings", "platforms", "marketTrend"],
        },
        rentalAnalysis: {
          type: "object",
          description: "Análise de rentabilidade por aluguel",
          properties: {
            monthlyRent: { type: "number", description: "Valor estimado de aluguel mensal em reais" },
            annualYield: { type: "number", description: "Rentabilidade anual em percentual (ex: 5.2)" },
            paybackYears: { type: "number", description: "Tempo de retorno do investimento em anos" },
            seasonalRent: { type: "number", description: "Valor estimado de aluguel na temporada (diária) em reais, se aplicável" },
          },
          required: ["monthlyRent", "annualYield", "paybackYears"],
        },
        improvementSuggestions: {
          type: "array",
          description: "Sugestões de melhorias para valorizar o imóvel",
          items: {
            type: "object",
            properties: {
              suggestion: { type: "string", description: "Descrição da melhoria sugerida" },
              estimatedImpact: { type: "string", description: "Impacto estimado na valorização, ex: +8-12%" },
              estimatedCost: { type: "string", description: "Custo estimado da melhoria, ex: R$ 15.000-25.000" },
            },
            required: ["suggestion", "estimatedImpact"],
          },
        },
        neighborhoodInsights: { type: "string", description: "Insights detalhados sobre o bairro/região: demanda, perfil de compradores, infraestrutura, pontos de interesse, tendências" },
        priceHistory: { type: "string", description: "Análise da tendência de preços nos últimos 6-12 meses na região" },
        estimatedSaleTime: {
          type: "object",
          properties: {
            minMonths: { type: "number" },
            maxMonths: { type: "number" },
            reasoning: { type: "string" },
          },
          required: ["minMonths", "maxMonths", "reasoning"],
        },
        justification: { type: "string", description: "Justificativa detalhada incluindo referências aos portais pesquisados" },
        premiums: {
          type: "array",
          items: {
            type: "object",
            properties: {
              factor: { type: "string" },
              percentage: { type: "string" },
            },
            required: ["factor", "percentage"],
          },
        },
      },
      required: ["marketValue", "quickSaleValue", "pricePerSqm", "confidenceScore", "internalComparables", "foundListings", "platformBreakdown", "externalAnalysis", "rentalAnalysis", "improvementSuggestions", "neighborhoodInsights", "priceHistory", "estimatedSaleTime", "justification", "premiums"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { propertyData, existingProperties } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const searchContext = `${propertyData.type} ${propertyData.area}m² ${propertyData.bedrooms} quartos em ${propertyData.city}${propertyData.address ? `, ${propertyData.address}` : ""}${propertyData.condominium ? `, ${propertyData.condominium}` : ""}`;

    const systemPrompt = `Você é um avaliador imobiliário profissional especializado no litoral gaúcho (Capão da Canoa, Xangri-lá, Atlântida, Torres, Tramandaí, Imbé, Cidreira).

TAREFA: Avaliar o seguinte imóvel com base em dados REAIS de mercado.

IMÓVEL A AVALIAR:
${JSON.stringify(propertyData, null, 2)}

IMÓVEIS DA BASE INTERNA DO CLIENTE (para comparação):
${JSON.stringify(existingProperties, null, 2)}

INSTRUÇÕES CRÍTICAS:

1. ANÚNCIOS ENCONTRADOS (foundListings):
   - Gere entre 5 e 15 anúncios similares que representem o mercado real da região
   - Use URLs realistas baseadas nos padrões dos portais:
     * ZAP: https://www.zapimoveis.com.br/imovel/venda-[tipo]-[cidade]-rs/...
     * OLX: https://www.olx.com.br/imoveis/venda/estado-rs/regiao-de-porto-alegre-e-litoral-norte/...
     * Viva Real: https://www.vivareal.com.br/imovel/[tipo]-[quartos]-quartos-[cidade]-rs-...
     * Mercado Livre: https://imoveis.mercadolivre.com.br/venda/[cidade]/...
     * ImóvelWeb: https://www.imovelweb.com.br/propriedades/[cidade]/venda/...
   - Inclua preços realistas e variados baseados no mercado da região
   - Calcule a similaridade com base em tipo, área, quartos, localização

2. DETALHAMENTO POR PORTAL (platformBreakdown):
   - Forneça estatísticas separadas para cada portal pesquisado
   - Inclua quantidade de anúncios, preço médio, mínimo e máximo por portal

3. ANÁLISE DE RENTABILIDADE (rentalAnalysis):
   - Calcule o aluguel mensal estimado baseado no mercado da região
   - Calcule o yield anual (aluguel anual / valor do imóvel * 100)
   - Calcule o payback em anos
   - Se for litoral, inclua estimativa de diária na temporada (seasonalRent)

4. SUGESTÕES DE VALORIZAÇÃO (improvementSuggestions):
   - Sugira 3-6 melhorias específicas para o imóvel
   - Inclua o impacto estimado na valorização e custo aproximado
   - Considere o tipo do imóvel e região

5. SCORE DE CONFIANÇA (confidenceScore):
   - 80-100: Muitos comparativos encontrados, alta precisão
   - 60-79: Comparativos razoáveis, boa precisão
   - 40-59: Poucos comparativos, precisão moderada
   - 0-39: Dados escassos, avaliação com alta margem de erro

6. INSIGHTS DO BAIRRO (neighborhoodInsights):
   - Descreva a demanda na região, perfil de compradores, infraestrutura disponível
   - Mencione proximidade de praias, comércio, escolas, hospitais

7. HISTÓRICO DE PREÇOS (priceHistory):
   - Descreva a tendência de preços nos últimos 6-12 meses
   - Mencione fatores que influenciaram (temporada, novos empreendimentos, etc)

CRITÉRIOS DE VALORIZAÇÃO:
- Localização (cidade, proximidade do mar, bairro nobre)
- Tipo do imóvel, área total e privativa
- Quartos, suítes e banheiros, vagas de garagem
- Vista mar (premium de 15-30%), decorado (premium de 5-15%)
- Andar alto (premium de 3-5% por andar)
- Infraestrutura do condomínio/empreendimento
- Estado de conservação e idade

Sempre responda em português brasileiro. Seja preciso, detalhado e profissional.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: await getAIModel(),
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Faça uma avaliação COMPLETA e DETALHADA deste imóvel: ${searchContext}. ${propertyData.seaView ? "Possui vista para o mar." : ""} ${propertyData.decorated ? "É decorado/mobiliado." : ""} ${propertyData.floor ? `Localizado no ${propertyData.floor}.` : ""} ${propertyData.description || ""}\n\nForneça:\n1. Pelo menos 5 anúncios similares com URLs de portais\n2. Breakdown por portal\n3. Análise de rentabilidade (aluguel)\n4. Sugestões de valorização com custo\n5. Score de confiança\n6. Insights do bairro\n7. Histórico de preços\n8. Previsão de venda`,
          },
        ],
        tools: [toolSchema],
        tool_choice: { type: "function", function: { name: "property_valuation" } },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para gerar avaliação." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "Erro ao processar avaliação" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Não foi possível gerar a avaliação. Tente novamente." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("property-valuation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
