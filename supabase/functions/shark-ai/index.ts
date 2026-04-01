import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getAIConfig() {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data } = await sb.from("system_settings").select("key, value").in("key", ["gemini_api_key", "ai_model"]);
  let apiKey = "";
  let model = "gemini-2.0-flash";
  for (const r of data || []) {
    if (r.key === "gemini_api_key") apiKey = r.value;
    if (r.key === "ai_model") model = r.value;
  }
  return { apiKey, model };
}

const toolDef = {
  name: "filter_properties",
  description: "Retorna os IDs dos imóveis que correspondem à busca e/ou uma explicação sobre mercado imobiliário.",
  parameters: {
    type: "object" as const,
    properties: {
      matchedIds: { type: "array" as const, items: { type: "string" as const }, description: "Array com os IDs dos imóveis encontrados. Vazio [] se a pergunta é sobre mercado/índices." },
      explanation: { type: "string" as const, description: "Explicação amigável em português." },
    },
    required: ["matchedIds", "explanation"],
    additionalProperties: false,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, properties } = await req.json();
    const { apiKey, model } = await getAIConfig();
    const useLovable = !apiKey;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (useLovable && !LOVABLE_API_KEY) throw new Error("Nenhuma API de IA configurada.");

    const systemPrompt = `Você é o SHARK 🦈, um tubarão inteligente e agressivo especialista em mercado imobiliário da MV BROKER CONNECT.

SUAS CAPACIDADES:
1. **Busca de Imóveis**: Analisa todos os campos e encontra os melhores matches.
2. **Conhecimento do Mercado Imobiliário**: INCC, CUB, IGP-M, IPCA, taxas, tendências, valorização, documentação, impostos.
3. **Cálculos**: Parcelas, financiamentos, ITBI, etc.

REGRAS DE RESPOSTA:
- Se o usuário busca imóveis → use a tool "filter_properties" com matchedIds e explanation
- Se o usuário pergunta sobre mercado/índices/dúvidas → use a tool "filter_properties" com matchedIds VAZIO [] e a resposta completa no campo explanation
- Sempre responda em português brasileiro
- Seja direto, agressivo como um tubarão 🦈
- Use emojis com moderação

LISTA DE IMÓVEIS DISPONÍVEIS:
${JSON.stringify(properties, null, 2)}`;

    let url: string;
    let headers: Record<string, string>;
    let body: any;

    if (useLovable) {
      url = "https://ai.gateway.lovable.dev/v1/chat/completions";
      headers = { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" };
      body = {
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: query }],
        tools: [{ type: "function", function: toolDef }],
        tool_choice: { type: "function", function: { name: "filter_properties" } },
      };
    } else {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      headers = { "Content-Type": "application/json" };
      body = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: query }] }],
        tools: [{
          function_declarations: [{
            name: toolDef.name,
            description: toolDef.description,
            parameters: toolDef.parameters,
          }],
        }],
        tool_config: { function_calling_config: { mode: "ANY", allowed_function_names: ["filter_properties"] } },
      };
    }

    const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Créditos esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const text = await response.text();
      console.error("AI error:", response.status, text);
      return new Response(JSON.stringify({ error: "Erro ao processar busca" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();

    let result: any;
    if (useLovable) {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        result = JSON.parse(toolCall.function.arguments);
      } else {
        const content = data.choices?.[0]?.message?.content || "";
        result = { matchedIds: [], explanation: content || "🦈 Não consegui processar sua busca." };
      }
    } else {
      const parts = data.candidates?.[0]?.content?.parts || [];
      const fc = parts.find((p: any) => p.functionCall);
      if (fc?.functionCall?.args) {
        result = fc.functionCall.args;
      } else {
        const textPart = parts.find((p: any) => p.text);
        result = { matchedIds: [], explanation: textPart?.text || "🦈 Não consegui processar." };
      }
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("shark-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
