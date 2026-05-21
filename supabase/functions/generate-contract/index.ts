import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

async function getAIModel(): Promise<string> {
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data } = await supabase.from("system_settings").select("value").eq("key", "ai_model").maybeSingle();
    return data?.value || "google/gemini-3-flash-preview";
  } catch { return "google/gemini-3-flash-preview"; }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { templateType, fields } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const templatePrompts: Record<string, string> = {
      "compra-venda": `Gere um CONTRATO DE COMPRA E VENDA DE IMÓVEL completo e profissional, em português do Brasil, seguindo o padrão jurídico brasileiro. Use as informações fornecidas para preencher todos os campos. Inclua cláusulas padrão de: objeto, preço e forma de pagamento, obrigações das partes, posse e transferência, penalidades, rescisão, foro e disposições gerais. Formate com numeração de cláusulas.`,
      
      "locacao": `Gere um CONTRATO DE LOCAÇÃO DE IMÓVEL completo e profissional, em português do Brasil, conforme a Lei do Inquilinato (Lei 8.245/91). Use as informações fornecidas. Inclua cláusulas de: objeto, prazo, aluguel e reajuste, garantia, obrigações do locador e locatário, benfeitorias, rescisão, multa, foro e disposições gerais. Formate com numeração de cláusulas.`,
      
      "recibo": `Gere um RECIBO DE PAGAMENTO completo e profissional, em português do Brasil. Use as informações fornecidas. O recibo deve conter: identificação de quem recebeu (nome, CPF), identificação de quem pagou (nome, CPF), valor por extenso e numérico, referência ao que se refere o pagamento, data e local. Formate de maneira clara e formal.`,
      
      "nota-promissoria": `Gere uma NOTA PROMISSÓRIA completa e profissional, em português do Brasil, seguindo o padrão legal brasileiro. Use as informações fornecidas. Deve conter: número da nota, valor por extenso e numérico, data de vencimento, nome e CPF do emitente (devedor), nome e CPF do beneficiário (credor), praça de pagamento, data de emissão. Formate conforme modelo padrão de nota promissória.`,
      
      "distrato": `Gere um DISTRATO / RESCISÃO CONTRATUAL completo e profissional, em português do Brasil. Use as informações fornecidas. Inclua: referência ao contrato original, motivo da rescisão, condições de devolução de valores, obrigações remanescentes, quitação mútua, foro. Formate com numeração de cláusulas.`,
      
      "autorizacao-venda": `Gere uma AUTORIZAÇÃO DE VENDA / TERMO DE EXCLUSIVIDADE completo e profissional, em português do Brasil. Use as informações fornecidas. Inclua: dados do proprietário, dados do imóvel, valor de venda autorizado, comissão do corretor/imobiliária, prazo de validade, condições, foro. Formate com numeração de cláusulas.`,

      "exclusividade-simplificada": `Gere um TERMO DE EXCLUSIVIDADE SIMPLIFICADO, em português do Brasil, ULTRA COMPACTO, OBRIGATORIAMENTE cabendo em UMA ÚNICA FOLHA A4 (máximo absoluto de 22 linhas de texto somando título, cláusulas, assinaturas e tudo mais). REGRAS DE FORMATAÇÃO RÍGIDAS:
- Use UMA ÚNICA linha de título centralizado: "TERMO DE EXCLUSIVIDADE DE INTERMEDIAÇÃO IMOBILIÁRIA"
- NÃO use subtítulos, NÃO use linhas em branco entre cláusulas, NÃO use preâmbulo/considerandos
- Cláusulas numeradas de 1 a 6, cada uma em UM ÚNICO parágrafo curto (máximo 2 linhas cada), formato: "1. TÍTULO CURTO EM CAIXA ALTA. Texto da cláusula em 1-2 linhas."
- Use frases curtas, diretas, sem floreios jurídicos

ESTRUTURA OBRIGATÓRIA (exatamente 6 cláusulas, nesta ordem):
1. OBJETO. Proprietário {nome}, CPF {cpf}, outorga ao corretor/imobiliária {corretor}, CRECI {creci}, exclusividade para intermediar a venda do imóvel: {descrição} situado em {endereço}.
2. PRAZO. Exclusividade pelo período de {prazo}, contados desta data, renovável por igual período se não houver manifestação em contrário.
3. PREÇO E COMISSÃO. Valor autorizado de venda: R$ {valor}. Comissão devida ao corretor: {comissão} sobre o valor efetivo da venda, paga na assinatura do contrato definitivo.
4. DIVULGAÇÃO NA REDE. A assinatura deste termo é REQUISITO OBRIGATÓRIO para que o imóvel seja publicado no sistema MV Broker Connect e divulgado a mais de 2.000 corretores parceiros, potencializando significativamente as chances de venda.
5. OBRIGAÇÕES DO PROPRIETÁRIO. Durante a vigência, o proprietário não poderá negociar o imóvel diretamente nem por meio de terceiros; eventual venda nessas condições obriga ao pagamento integral da comissão.
6. FORO. Fica eleito o foro da comarca de {cidade} para dirimir quaisquer questões oriundas deste termo.

Após a cláusula 6, em UMA linha: "{cidade}, ___ de _________ de ______."
Depois, em DUAS linhas de assinatura lado a lado (use uma linha de underscores de aproximadamente 40 caracteres em cada): "_______________________   _______________________" e abaixo, na mesma linha: "Proprietário                                    Corretor/Imobiliária - CRECI"
Contato do proprietário: {telefone} em uma linha discreta no rodapé.

NÃO ultrapasse 22 linhas no total. NÃO inclua nada além do solicitado.`,
    };

    const systemPrompt = templatePrompts[templateType] || templatePrompts["compra-venda"];

    const fieldsText = Object.entries(fields)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

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
              content: `Dados para preencher o documento:\n\n${fieldsText}\n\nIMPORTANTE: Se o valor de algum campo for composto apenas por underscores (ex: "_______________"), trate esse campo como em branco e, no texto final, escreva o campo seguido de uma linha contínua de underscores LONGA O SUFICIENTE PARA SE ESTENDER ATÉ O FINAL DA LINHA do documento A4 (use no mínimo 70 caracteres "_" consecutivos, na mesma fonte do parágrafo, sem quebras). Se o campo aparecer no meio do parágrafo, ainda assim use underscores suficientes para preencher visualmente o restante da linha. Gere o documento completo, pronto para uso. Não inclua instruções ou comentários, apenas o texto do documento formatado.`,
            },

          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos no workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar documento" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("contract generation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
