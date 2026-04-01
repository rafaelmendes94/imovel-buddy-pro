import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { templateType, fields } = await req.json();
    const { apiKey, model } = await getAIConfig();
    const useLovable = !apiKey;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (useLovable && !LOVABLE_API_KEY) throw new Error("Nenhuma API de IA configurada.");

    const templatePrompts: Record<string, string> = {
      "compra-venda": `Gere um CONTRATO DE COMPRA E VENDA DE IMÓVEL completo e profissional, em português do Brasil, seguindo o padrão jurídico brasileiro. Use as informações fornecidas para preencher todos os campos. Inclua cláusulas padrão de: objeto, preço e forma de pagamento, obrigações das partes, posse e transferência, penalidades, rescisão, foro e disposições gerais. Formate com numeração de cláusulas.`,
      "locacao": `Gere um CONTRATO DE LOCAÇÃO DE IMÓVEL completo e profissional, em português do Brasil, conforme a Lei do Inquilinato (Lei 8.245/91). Use as informações fornecidas. Inclua cláusulas de: objeto, prazo, aluguel e reajuste, garantia, obrigações do locador e locatário, benfeitorias, rescisão, multa, foro e disposições gerais. Formate com numeração de cláusulas.`,
      "recibo": `Gere um RECIBO DE PAGAMENTO completo e profissional, em português do Brasil. Use as informações fornecidas. O recibo deve conter: identificação de quem recebeu (nome, CPF), identificação de quem pagou (nome, CPF), valor por extenso e numérico, referência ao que se refere o pagamento, data e local. Formate de maneira clara e formal.`,
      "nota-promissoria": `Gere uma NOTA PROMISSÓRIA completa e profissional, em português do Brasil, seguindo o padrão legal brasileiro. Use as informações fornecidas. Deve conter: número da nota, valor por extenso e numérico, data de vencimento, nome e CPF do emitente (devedor), nome e CPF do beneficiário (credor), praça de pagamento, data de emissão. Formate conforme modelo padrão de nota promissória.`,
      "distrato": `Gere um DISTRATO / RESCISÃO CONTRATUAL completo e profissional, em português do Brasil. Use as informações fornecidas. Inclua: referência ao contrato original, motivo da rescisão, condições de devolução de valores, obrigações remanescentes, quitação mútua, foro. Formate com numeração de cláusulas.`,
      "autorizacao-venda": `Gere uma AUTORIZAÇÃO DE VENDA / TERMO DE EXCLUSIVIDADE completo e profissional, em português do Brasil. Use as informações fornecidas. Inclua: dados do proprietário, dados do imóvel, valor de venda autorizado, comissão do corretor/imobiliária, prazo de validade, condições, foro. Formate com numeração de cláusulas.`,
    };

    const systemPrompt = templatePrompts[templateType] || templatePrompts["compra-venda"];
    const fieldsText = Object.entries(fields).filter(([_, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n");
    const userContent = `Dados para preencher o documento:\n\n${fieldsText}\n\nGere o documento completo, pronto para uso. Não inclua instruções ou comentários, apenas o texto do documento formatado.`;

    if (useLovable) {
      // Streaming via Lovable gateway
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userContent }],
          stream: true,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (response.status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const t = await response.text();
        console.error("AI error:", response.status, t);
        return new Response(JSON.stringify({ error: "Erro ao gerar documento" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    } else {
      // Gemini API (non-streaming, then convert to SSE for client compatibility)
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userContent }] }],
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("Gemini error:", response.status, t);
        return new Response(JSON.stringify({ error: "Erro ao gerar documento" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // Simulate SSE stream for client compatibility
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          // Send chunks
          const chunkSize = 50;
          for (let i = 0; i < text.length; i += chunkSize) {
            const chunk = text.slice(i, i + chunkSize);
            const sseData = JSON.stringify({ choices: [{ delta: { content: chunk } }] });
            controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }
  } catch (e) {
    console.error("contract generation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
