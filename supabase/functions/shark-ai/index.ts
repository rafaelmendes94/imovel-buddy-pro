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
    const { query, properties } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é o SHARK 🦈, um tubarão inteligente e agressivo especialista em mercado imobiliário da MV Connect.

SUAS CAPACIDADES:
1. **Busca de Imóveis**: Analisa todos os campos (título, endereço, cidade, tipo, preço, área, quartos, banheiros, vagas, decorado, vista mar, aceita permuta, condições de pagamento, empreendimento) e encontra os melhores matches.
2. **Conhecimento do Mercado Imobiliário**: Você é especialista em:
   - INCC (Índice Nacional de Custo da Construção) - valores atuais, histórico, impacto nos financiamentos
   - CUB (Custo Unitário Básico) - valores por estado, tendências
   - IGP-M e IPCA aplicados ao mercado imobiliário
   - Taxas de financiamento imobiliário (Selic, TR, IPCA+)
   - Tendências do mercado imobiliário brasileiro
   - Dicas de investimento em imóveis
   - Valorização por região, especialmente litoral gaúcho (Capão da Canoa, Xangri-lá, Atlântida)
   - Documentação necessária para compra/venda
   - Impostos (ITBI, ITCMD, IR sobre ganho de capital)
   - Consórcio vs financiamento
   - Permuta e suas regras
   - Usucapião, escritura, matrícula, registro
3. **Cálculos**: Pode calcular parcelas, simular financiamentos, calcular ITBI, etc.

REGRAS DE RESPOSTA:
- Se o usuário busca imóveis → use a tool "filter_properties" com matchedIds e explanation
- Se o usuário pergunta sobre mercado/índices/dúvidas → use a tool "filter_properties" com matchedIds VAZIO [] e a resposta completa no campo explanation
- Sempre responda em português brasileiro
- Seja direto, agressivo como um tubarão que vai atrás do melhor negócio 🦈
- Use emojis de tubarão 🦈 e mar 🌊 com moderação
- Forneça dados precisos e atualizados quando possível
- Para índices econômicos, mencione que os valores podem ter sido atualizados e sugira consultar fontes oficiais (IBGE, CBIC, Banco Central)

LISTA DE IMÓVEIS DISPONÍVEIS:
${JSON.stringify(properties, null, 2)}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "filter_properties",
                description:
                  "Retorna os IDs dos imóveis que correspondem à busca e/ou uma explicação sobre mercado imobiliário.",
                parameters: {
                  type: "object",
                  properties: {
                    matchedIds: {
                      type: "array",
                      items: { type: "string" },
                      description:
                        "Array com os IDs dos imóveis encontrados. Vazio [] se a pergunta é sobre mercado/índices.",
                    },
                    explanation: {
                      type: "string",
                      description:
                        "Explicação amigável em português. Para buscas: descreva os resultados. Para perguntas de mercado: responda completamente com dados.",
                    },
                  },
                  required: ["matchedIds", "explanation"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "filter_properties" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Muitas requisições. Tente novamente em alguns segundos.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "Créditos esgotados. Adicione fundos na sua conta.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "Erro ao processar busca" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
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

    const content = data.choices?.[0]?.message?.content || "";
    return new Response(
      JSON.stringify({
        matchedIds: [],
        explanation:
          content || "🦈 Não consegui processar sua busca. Tente novamente!",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("shark-ai error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
