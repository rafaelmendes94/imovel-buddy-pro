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

    const systemPrompt = `Você é o SHARK 🦈, um assistente inteligente de busca imobiliária da MV Broker Conect.
Seu trabalho é analisar a lista de imóveis disponíveis e encontrar os que melhor correspondem ao pedido do usuário.

REGRAS:
1. Analise TODOS os campos de cada imóvel: título, endereço, cidade, tipo, preço, área, quartos, banheiros, vagas, decorado, vista mar, aceita permuta, condições de pagamento, empreendimento, etc.
2. Retorne os IDs dos imóveis que correspondem ao pedido usando a tool "filter_properties".
3. Se nenhum imóvel corresponder exatamente, retorne os mais próximos e explique as diferenças.
4. Sempre responda em português brasileiro de forma amigável e objetiva.
5. Use emojis de tubarão 🦈 e do mar 🌊 na sua resposta.
6. Seja simpático e útil, como um consultor imobiliário experiente.
7. Se o usuário fizer uma pergunta genérica (como "oi" ou "o que você faz"), explique suas capacidades.

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
                  "Retorna os IDs dos imóveis que correspondem à busca do usuário, junto com uma explicação.",
                parameters: {
                  type: "object",
                  properties: {
                    matchedIds: {
                      type: "array",
                      items: { type: "string" },
                      description: "Array com os IDs dos imóveis encontrados",
                    },
                    explanation: {
                      type: "string",
                      description:
                        "Explicação amigável em português sobre os resultados encontrados, usando emojis de tubarão",
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

    // Fallback if no tool call
    const content = data.choices?.[0]?.message?.content || "";
    return new Response(
      JSON.stringify({
        matchedIds: [],
        explanation: content || "🦈 Não consegui processar sua busca. Tente novamente!",
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
