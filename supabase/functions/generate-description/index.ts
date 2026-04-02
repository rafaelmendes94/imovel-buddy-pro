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
    const { property, style } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const stylePrompts: Record<string, string> = {
      gatilhos: `Gere uma descrição de venda com GATILHOS MENTAIS poderosos (escassez, urgência, exclusividade, prova social, autoridade). 
Use frases como "Última unidade", "Oportunidade única", "Valorização garantida", "Os melhores investidores já garantiram".
Seja persuasivo e crie senso de urgência. Use emojis estratégicos. Máximo 4 parágrafos.`,
      
      agressiva: `Gere uma descrição de venda AGRESSIVA e IMPACTANTE, focada em conversão. 
Use linguagem direta e enfática. Destaque o ROI, valorização, benefícios financeiros.
Frases curtas e de impacto. Use chamadas para ação fortes como "GARANTA AGORA", "NÃO PERCA".
Foque em diferencial competitivo e por que este é O MELHOR negócio. Máximo 4 parágrafos.`,
      
      informativa: `Gere uma descrição COMPLETA e INFORMATIVA, detalhando TODOS os aspectos do imóvel.
Inclua informações técnicas, medidas, acabamentos, posição solar, infraestrutura do entorno.
Detalhe a localização: proximidade a escolas, mercados, farmácias, praia, comércio.
Seja técnico e profissional, como um laudo descritivo de qualidade. Máximo 5 parágrafos.`,
      
      geolocalizacao: `Gere uma descrição focada na LOCALIZAÇÃO e GEOLOCALIZAÇÃO do imóvel.
Destaque a região, bairro, proximidade com pontos de interesse (praia, centro, comércio, escolas, hospitais).
Fale sobre a infraestrutura urbana da região, acessos, vias principais, transporte.
Mencione valorização da região e dados do entorno. Máximo 4 parágrafos.`,
    };

    const stylePrompt = stylePrompts[style] || stylePrompts.informativa;

    const propertyInfo = `
DADOS DO IMÓVEL:
- Título: ${property.title}
- Tipo: ${property.type}
- Status: ${property.status}
- Preço: R$ ${property.price?.toLocaleString("pt-BR")}
- Endereço: ${property.address}, ${property.city}
- Área: ${property.area}m²
${property.privateArea ? `- Área Privativa: ${property.privateArea}m²` : ""}
- Quartos: ${property.bedrooms}
- Banheiros: ${property.bathrooms}
- Vagas: ${property.parking}
${property.seaView ? "- ✓ Vista para o Mar" : ""}
${property.decorated ? "- ✓ Decorado / Mobiliado" : ""}
${property.acceptsExchange ? "- ✓ Aceita Permuta" : ""}
${property.empreendimento ? `- Empreendimento: ${property.empreendimento}` : ""}
${property.posicaoPredio ? `- Posição no Prédio: ${property.posicaoPredio}` : ""}
${property.posicaoSolar ? `- Posição Solar: ${property.posicaoSolar}` : ""}
${property.vista ? `- Vista: ${property.vista}` : ""}
${property.condicao ? `- Condição: ${property.condicao}` : ""}
${property.infraestrutura?.length ? `- Infraestrutura: ${property.infraestrutura.join(", ")}` : ""}
${property.elevadores ? `- Elevadores: ${property.elevadores}` : ""}
${property.paymentConditions?.length ? `- Condições de Pagamento: ${property.paymentConditions.join(", ")}` : ""}
${property.neighborhood ? `- Bairro: ${property.neighborhood}` : ""}
`.trim();

    const systemPrompt = `Você é um copywriter imobiliário profissional especializado no litoral gaúcho (Capão da Canoa, Xangri-lá, Tramandaí, Torres). 
Gere descrições em português brasileiro, profissionais e atrativas.
NÃO inclua o preço na descrição (ele já aparece separado no anúncio).
NÃO invente informações que não foram fornecidas nos dados.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${stylePrompt}\n\n${propertyInfo}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("Erro ao gerar descrição");
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ description }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-description error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
