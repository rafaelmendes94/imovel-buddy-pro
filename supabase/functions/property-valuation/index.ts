import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const systemPrompt = `Você é um avaliador imobiliário profissional especializado no litoral gaúcho (Capão da Canoa, Xangri-lá, Atlântida, Torres, Tramandaí).

O cliente quer uma avaliação de mercado para o seguinte imóvel:
${JSON.stringify(propertyData, null, 2)}

IMÓVEIS COMPARATIVOS DO SISTEMA (base interna):
${JSON.stringify(existingProperties, null, 2)}

VOCÊ DEVE RETORNAR UM JSON com a seguinte estrutura usando a tool "property_valuation":

1. **Análise Interna**: Compare com imóveis semelhantes do sistema (mesmo tipo, cidade similar, área próxima, quartos similares)
2. **Valor de Mercado**: Estime um valor justo de mercado baseado nos comparativos
3. **Valor Venda Rápida**: Estime um valor 15-25% abaixo do mercado para venda rápida
4. **Análise Externa**: Simule uma pesquisa em plataformas como ZAP Imóveis, OLX, VivaReal com base no seu conhecimento de mercado para a região. Forneça faixa de preço praticada nessas plataformas.
5. **Justificativa**: Explique os critérios usados

CRITÉRIOS DE AVALIAÇÃO:
- Localização (cidade, proximidade do mar)
- Tipo do imóvel (apt, casa, terreno, comercial)
- Área (m²)
- Quartos e suítes
- Vagas de garagem
- Vista mar (premium de 15-30%)
- Decorado (premium de 5-10%)
- Andar alto em edifícios (premium de 3-5% por andar)
- Estado de conservação
- Infraestrutura do condomínio/edifício

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
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Avalie este imóvel: ${propertyData.type} de ${propertyData.area}m² com ${propertyData.bedrooms} quartos em ${propertyData.city}. ${propertyData.seaView ? "Com vista mar." : ""} ${propertyData.decorated ? "Decorado." : ""} ${propertyData.description || ""}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "property_valuation",
                description: "Retorna a avaliação completa do imóvel com valores de mercado e comparativos.",
                parameters: {
                  type: "object",
                  properties: {
                    marketValue: {
                      type: "number",
                      description: "Valor estimado de mercado em reais",
                    },
                    quickSaleValue: {
                      type: "number",
                      description: "Valor estimado para venda rápida em reais (15-25% abaixo do mercado)",
                    },
                    pricePerSqm: {
                      type: "number",
                      description: "Valor estimado por metro quadrado em reais",
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
                        zapMinPrice: { type: "number", description: "Preço mínimo encontrado em plataformas" },
                        zapMaxPrice: { type: "number", description: "Preço máximo encontrado em plataformas" },
                        zapAvgPrice: { type: "number", description: "Preço médio encontrado em plataformas" },
                        totalListings: { type: "number", description: "Número estimado de anúncios similares" },
                        platforms: { type: "string", description: "Plataformas consultadas" },
                        marketTrend: { type: "string", description: "Tendência de mercado: alta, estável, baixa" },
                      },
                      required: ["zapMinPrice", "zapMaxPrice", "zapAvgPrice", "totalListings", "platforms", "marketTrend"],
                    },
                    justification: {
                      type: "string",
                      description: "Justificativa detalhada da avaliação em português",
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
                  required: ["marketValue", "quickSaleValue", "pricePerSqm", "internalComparables", "externalAnalysis", "justification", "premiums"],
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
