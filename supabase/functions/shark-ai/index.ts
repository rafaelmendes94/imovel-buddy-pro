import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { geminiJson, getAIModel } from "../_shared/gemini.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, properties } = await req.json();

    const systemPrompt = `Você é o SHARK 🦈, um tubarão inteligente e agressivo especialista em mercado imobiliário da MV BROKER CONNECT.

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
- Responda somente JSON válido no formato {"matchedIds":[],"explanation":"..."}.
- matchedIds deve conter apenas IDs existentes na lista de imóveis enviada.

LISTA DE IMÓVEIS DISPONÍVEIS:
${JSON.stringify(properties, null, 2)}`;

    const result = await geminiJson<{ matchedIds?: string[]; explanation?: string }>(systemPrompt, query, {
      model: await getAIModel("gemini-2.5-flash"),
      temperature: 0.2,
    });
    return new Response(
      JSON.stringify({
        matchedIds: Array.isArray(result.matchedIds) ? result.matchedIds : [],
        explanation:
          result.explanation || "🦈 Não consegui processar sua busca. Tente novamente!",
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
}

if (import.meta.main) serve(handler);
