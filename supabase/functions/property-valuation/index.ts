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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { propertyData, existingProperties } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build a detailed search query for the AI to research
    const searchContext = `${propertyData.type} ${propertyData.area}m² ${propertyData.bedrooms} quartos em ${propertyData.city}${propertyData.address ? `, ${propertyData.address}` : ""}${propertyData.condominium ? `, ${propertyData.condominium}` : ""}`;

    const systemPrompt = `Você é um avaliador imobiliário profissional especializado no litoral gaúcho (Capão da Canoa, Xangri-lá, Atlântida, Torres, Tramandaí, Imbé, Cidreira).

TAREFA: Avaliar o seguinte imóvel com base em dados REAIS de mercado.

IMÓVEL A AVALIAR:
${JSON.stringify(propertyData, null, 2)}

IMÓVEIS DA BASE INTERNA DO CLIENTE (para comparação):
${JSON.stringify(existingProperties, null, 2)}

INSTRUÇÕES CRÍTICAS PARA PESQUISA EXTERNA:
1. Pesquise ATIVAMENTE nos seguintes portais imobiliários por imóveis similares na região:
   - ZAP Imóveis (zapimoveis.com.br)
   - OLX (olx.com.br) 
   - Viva Real (vivareal.com.br)
   - Mercado Livre Imóveis (imoveis.mercadolivre.com.br)
   - ImóvelWeb (imovelweb.com.br)

2. Busque: "${searchContext}"

3. Analise os preços praticados REAIS desses portais para imóveis similares:
   - Mesmo tipo (${propertyData.type})
   - Mesma cidade (${propertyData.city}) ou cidades vizinhas do litoral gaúcho
   - Área similar (${propertyData.area}m² ± 30%)
   - Mesmo número de quartos (${propertyData.bedrooms} ± 1)

4. Forneça os preços REAIS encontrados, não estimativas genéricas.

CRITÉRIOS DE VALORIZAÇÃO:
- Localização (cidade, proximidade do mar, bairro nobre)
- Tipo do imóvel
- Área total e privativa
- Quartos, suítes e banheiros
- Vagas de garagem
- Vista mar (premium de 15-30%)
- Decorado (premium de 5-15%)
- Andar alto em edifícios (premium de 3-5% por andar)
- Infraestrutura do condomínio/empreendimento
- Estado de conservação e idade

IMPORTANTE: A análise externa DEVE refletir preços REAIS encontrados em portais, com o número real de anúncios similares encontrados. Seja específico sobre quais plataformas consultou e quantos anúncios encontrou em cada uma.

Sempre responda em português brasileiro. Seja preciso e profissional.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
              content: `Faça uma avaliação completa e detalhada deste imóvel: ${searchContext}. ${propertyData.seaView ? "Possui vista para o mar." : ""} ${propertyData.decorated ? "É decorado/mobiliado." : ""} ${propertyData.floor ? `Localizado no ${propertyData.floor}.` : ""} ${propertyData.description || ""}\n\nPesquise preços REAIS em portais imobiliários (ZAP, OLX, Viva Real, Mercado Livre) para imóveis similares nesta região e forneça uma avaliação precisa.`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "property_valuation",
                description: "Retorna a avaliação completa do imóvel com valores de mercado baseados em pesquisa real de portais imobiliários.",
                parameters: {
                  type: "object",
                  properties: {
                    marketValue: {
                      type: "number",
                      description: "Valor estimado de mercado em reais baseado na pesquisa real",
                    },
                    quickSaleValue: {
                      type: "number",
                      description: "Valor estimado para venda rápida em reais (15-25% abaixo do mercado)",
                    },
                    pricePerSqm: {
                      type: "number",
                      description: "Valor por metro quadrado em reais",
                    },
                    internalComparables: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          title: { type: "string" },
                          price: { type: "number" },
                          similarity: { type: "string", description: "Percentual de similaridade ex: 85%" },
                        },
                        required: ["id", "title", "price", "similarity"],
                      },
                      description: "Imóveis comparáveis encontrados no sistema interno",
                    },
                    externalAnalysis: {
                      type: "object",
                      properties: {
                        zapMinPrice: { type: "number", description: "Preço mínimo encontrado em portais" },
                        zapMaxPrice: { type: "number", description: "Preço máximo encontrado em portais" },
                        zapAvgPrice: { type: "number", description: "Preço médio encontrado em portais" },
                        totalListings: { type: "number", description: "Número total de anúncios similares encontrados" },
                        platforms: { type: "string", description: "Plataformas pesquisadas e quantidade de anúncios em cada uma, ex: ZAP (12), OLX (8), Viva Real (15)" },
                        marketTrend: { type: "string", description: "Tendência de mercado: alta, estável, baixa" },
                      },
                      required: ["zapMinPrice", "zapMaxPrice", "zapAvgPrice", "totalListings", "platforms", "marketTrend"],
                    },
                    estimatedSaleTime: {
                      type: "object",
                      properties: {
                        minMonths: { type: "number", description: "Tempo mínimo estimado de venda em meses" },
                        maxMonths: { type: "number", description: "Tempo máximo estimado de venda em meses" },
                        reasoning: { type: "string", description: "Justificativa da estimativa de tempo de venda baseado na demanda e comparáveis encontrados" },
                      },
                      required: ["minMonths", "maxMonths", "reasoning"],
                      description: "Estimativa de tempo para venda do imóvel baseada na demanda da região e comparáveis",
                    },
                    justification: {
                      type: "string",
                      description: "Justificativa detalhada da avaliação em português, incluindo referências aos portais pesquisados e preços encontrados",
                    },
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
                      description: "Fatores que adicionam ou reduzem valor",
                    },
                  },
                  required: ["marketValue", "quickSaleValue", "pricePerSqm", "internalComparables", "externalAnalysis", "estimatedSaleTime", "justification", "premiums"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "property_valuation" },
          },
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes para gerar avaliação." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Erro ao processar avaliação" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Não foi possível gerar a avaliação. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("property-valuation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
