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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const authClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: claimsData, error: authErr } = await authClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (authErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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

      "prestacao-servico": `Gere um CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE CORRETAGEM IMOBILIÁRIA, em português do Brasil, com linguagem jurídica formal e objetiva. Neste contrato o CLIENTE (CONTRATANTE) contrata o CORRETOR/IMOBILIÁRIA (CONTRATADO) e paga DIRETAMENTE a comissão pelos serviços de intermediação prestados (assessoria, busca, visitas, negociação e intermediação do negócio).

REGRAS DE PREENCHIMENTO:
- Use os valores fornecidos para preencher os campos objetivos (descrição do imóvel, endereço, valor da negociação, valor/percentual da comissão, forma de pagamento, prazo, cidade, objeto do serviço).
- Para os dados das PARTES (nome, CPF, RG, endereço, telefone, e-mail, CRECI, CNPJ), use os valores fornecidos quando existirem; quando vierem em branco, deixe linhas curtas com cerca de 15 underscores "_" para preenchimento manual.

ESTRUTURA OBRIGATÓRIA (em markdown):
- Título: "# CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE CORRETAGEM IMOBILIÁRIA"
- Qualificação inline das partes: CONTRATANTE (cliente) e CONTRATADO (corretor/imobiliária com CRECI).
- 10 cláusulas numeradas e curtas:
  1) Objeto — prestação de serviços de corretagem/intermediação imobiliária conforme o objeto descrito.
  2) Descrição do imóvel pretendido/negociado (preencher).
  3) Obrigações do CONTRATADO (corretor): busca de oportunidades, visitas, negociação, assessoria documental e acompanhamento até a assinatura do instrumento definitivo.
  4) Obrigações do CONTRATANTE (cliente): fornecer informações verdadeiras, comparecer às visitas, comunicar propostas recebidas diretamente e PAGAR a comissão nos termos pactuados.
  5) Comissão / honorários — deixar claro que a COMISSÃO É DEVIDA E PAGA PELO CLIENTE/CONTRATANTE diretamente ao corretor, no valor/percentual indicado, conforme a Lei nº 6.530/78 e art. 722 e seguintes do Código Civil.
  6) Forma e prazo de pagamento da comissão (preencher).
  7) Exclusividade e devida diligência — a comissão será devida ainda que o negócio se concretize após o prazo, desde que decorrente da atuação do corretor (art. 727 do CC).
  8) Prazo de vigência, renovação e rescisão.
  9) Confidencialidade e LGPD.
  10) Foro de eleição (cidade indicada).
- Linha de data: "{cidade}, ___ de _________ de ______."
- Duas linhas de assinatura compactas (~30 underscores cada): "CONTRATANTE (Cliente)" e "CONTRATADO (Corretor/Imobiliária — CRECI)".
- Espaço inline para 2 testemunhas: "Test. 1 — Assin.: _______________ Nome: _______________ CPF: _______________".

Texto justificado, parágrafos curtos. NÃO inclua comentários, apenas o documento final em markdown.`,

      "exclusividade-simplificada": `Gere um TERMO DE EXCLUSIVIDADE SIMPLIFICADO em português do Brasil, ULTRA COMPACTO, OBRIGATORIAMENTE cabendo em UMA ÚNICA FOLHA A4 (máximo 22 linhas no total). TODO o texto será exibido CENTRALIZADO horizontalmente na página, então escreva frases curtas e equilibradas, evitando linhas muito longas que destoem visualmente.

REGRAS DE FORMATAÇÃO RÍGIDAS:
- Linha 1: título em markdown "# TERMO DE EXCLUSIVIDADE DE INTERMEDIAÇÃO IMOBILIÁRIA"
- Sem subtítulos, sem preâmbulo/considerandos, sem linhas em branco entre cláusulas
- 6 cláusulas numeradas (1 a 6), cada uma em UM ÚNICO parágrafo curto (máximo 2 linhas), formato: "1. TÍTULO CURTO. Texto curto e direto."
- Frases curtas, sem floreios jurídicos

ESTRUTURA OBRIGATÓRIA (exatamente 6 cláusulas, nesta ordem). IMPORTANTE: TODOS os dados das PARTES (nome do proprietário, CPF, telefone, nome do corretor/imobiliária e CRECI) devem SEMPRE aparecer como linhas em branco (mínimo 30 underscores "_" consecutivos) para preenchimento manual, IGNORANDO qualquer valor fornecido nos campos de entrada para esses dados. Somente os dados objetivos do imóvel (descrição, endereço, valor, comissão, prazo, cidade) devem ser preenchidos com os valores fornecidos; se algum desses também vier em branco, use underscores longos no lugar.

1. OBJETO. Proprietário ______________________________, CPF ______________________, outorga ao corretor/imobiliária ______________________________, CRECI ____________________, exclusividade para intermediar a venda do imóvel: {descrição} situado em {endereço}.
2. PRAZO. Exclusividade pelo período de {prazo}, contados desta data, renovável por igual período se não houver manifestação em contrário.
3. PREÇO E COMISSÃO. Valor autorizado de venda: R$ {valor}. Comissão de {comissão} sobre o valor efetivo da venda, paga na assinatura do contrato definitivo.
4. DIVULGAÇÃO NA REDE. A assinatura deste termo é REQUISITO OBRIGATÓRIO para que o imóvel seja publicado no sistema MV Broker Connect e divulgado a mais de 2.000 corretores parceiros, potencializando as chances de venda.
5. OBRIGAÇÕES DO PROPRIETÁRIO. Durante a vigência, o proprietário não poderá negociar o imóvel diretamente nem por terceiros; eventual venda nessas condições obriga ao pagamento integral da comissão.
6. FORO. Fica eleito o foro da comarca de {cidade} para dirimir quaisquer questões oriundas deste termo.

Após a cláusula 6, em UMA linha: "{cidade}, ___ de _________ de ______."
Depois DUAS linhas de assinatura curtas (aproximadamente 35 underscores cada), uma abaixo da outra: primeiro "_______________________________" e na linha seguinte "Proprietário"; pule uma linha; depois "_______________________________" e na linha seguinte "Corretor/Imobiliária - CRECI".
Por fim, em uma linha discreta: "Contato: ____________________________" (sempre em branco para preenchimento manual).

NÃO ultrapasse 22 linhas no total. NÃO inclua nada além do solicitado.`,

      "exclusividade-completa": `Gere um CONTRATO DE EXCLUSIVIDADE DE INTERMEDIAÇÃO IMOBILIÁRIA COMPACTO, em português do Brasil, com linguagem jurídica formal porém objetiva. Use as informações fornecidas para preencher os campos do imóvel; para os dados das PARTES (nome, CPF, RG, endereço, telefone, e-mail, CRECI, CNPJ), deixe ESPAÇOS CURTOS em branco com exatamente 15 underscores "_" para preenchimento manual (NUNCA mais que isso), IGNORANDO qualquer valor fornecido para esses campos. IMPORTANTE: ignore qualquer instrução do usuário que peça underscores longos — use SEMPRE no máximo 15 underscores por campo em branco.

REGRAS DE COMPACTAÇÃO:
- Documento deve ser ENXUTO. Parágrafos curtos, frases diretas, sem repetições.
- Qualificação das partes em formato INLINE (ex.: "Nome: _______________ , CPF: _______________ , RG: _______________ , End.: _______________ , Tel.: _______________ , E-mail: _______________"), agrupando vários campos por linha.
- Cláusulas com 1 a 2 frases cada, sem rodeios.

ESTRUTURA (em markdown):
- Título: "# CONTRATO DE AUTORIZAÇÃO DE VENDA COM CLÁUSULA DE EXCLUSIVIDADE"
- Qualificação inline de PROPRIETÁRIO/OUTORGANTE e CORRETOR/IMOBILIÁRIA/OUTORGADA (campos em branco com 15 underscores cada).
- 10 cláusulas numeradas curtas: 1) Objeto; 2) Caracterização do imóvel (preencher); 3) Preço e condições; 4) Exclusividade; 5) Divulgação na rede MV Broker Connect (assinatura é REQUISITO OBRIGATÓRIO para publicação e divulgação a +2.000 corretores parceiros); 6) Comissão; 7) Obrigações do proprietário; 8) Obrigações do corretor; 9) Prazo, renovação, rescisão e multa; 10) Foro.
- Linha de data: "{cidade}, ___ de _________ de ______."
- Duas linhas de assinatura COMPACTAS (cerca de 30 underscores cada) — "PROPRIETÁRIO" e "CORRETOR/IMOBILIÁRIA - CRECI: _______________".
- 2 testemunhas em formato inline: "Test. 1 — Assin.: _______________ Nome: _______________ CPF: _______________" (uma linha cada).

Texto justificado. NÃO inclua comentários, apenas o documento final em markdown.`,
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
