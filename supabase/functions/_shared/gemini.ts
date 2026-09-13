import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

type GeminiOptions = {
  model?: string;
  temperature?: number;
};

const normalizeModel = (model?: string | null, fallback = "gemini-2.5-flash") => {
  const value = (model || Deno.env.get("GEMINI_MODEL") || fallback).trim();
  const clean = value.replace(/^google\//, "");
  if (!clean || clean.includes("gemini-3")) return fallback;
  return clean;
};

export async function getGeminiKey() {
  const envKey = Deno.env.get("GEMINI_API_KEY")?.trim();
  if (envKey) return envKey;

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (url && serviceKey) {
      const supabase = createClient(url, serviceKey);
      const { data } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "gemini_api_key")
        .maybeSingle();
      const key = data?.value?.trim();
      if (key) return key;
    }
  } catch {
    // Env fallback already checked.
  }

  throw new Error("GEMINI_API_KEY não configurada no servidor.");
}

export async function getAIModel(fallback = "gemini-2.5-flash") {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (url && serviceKey) {
      const supabase = createClient(url, serviceKey);
      const { data } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "ai_model")
        .maybeSingle();
      return normalizeModel(data?.value, fallback);
    }
  } catch {
    // Use fallback.
  }
  return normalizeModel(null, fallback);
}

async function callGemini(systemPrompt: string, userPrompt: string, opts?: GeminiOptions & { json?: boolean }) {
  const key = await getGeminiKey();
  const model = normalizeModel(opts?.model, opts?.model?.includes("pro") ? "gemini-2.5-pro" : "gemini-2.5-flash");
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=` +
    encodeURIComponent(key);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: opts?.temperature ?? 0.2,
        ...(opts?.json ? { responseMimeType: "application/json" } : {}),
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Limite de requisições do Gemini atingido. Tente novamente em instantes.");
    if (res.status === 401 || res.status === 403) throw new Error("Chave Gemini inválida ou sem permissão.");
    throw new Error(`Falha no Gemini (HTTP ${res.status}): ${body.slice(0, 300)}`);
  }

  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("").trim() || "";
  if (!text) throw new Error("Gemini retornou resposta vazia.");
  return text;
}

export async function geminiText(systemPrompt: string, userPrompt: string, opts?: GeminiOptions) {
  return await callGemini(systemPrompt, userPrompt, opts);
}

export async function geminiJson<T = any>(systemPrompt: string, userPrompt: string, opts?: GeminiOptions): Promise<T> {
  const text = await callGemini(systemPrompt, userPrompt, { ...opts, json: true });
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) return JSON.parse(match[1]) as T;
    throw new Error("Gemini não retornou JSON válido.");
  }
}
