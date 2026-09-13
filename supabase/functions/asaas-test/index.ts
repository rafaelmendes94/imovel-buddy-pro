import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

const getServiceKey = () => {
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeys) {
    try {
      const parsed = JSON.parse(secretKeys);
      if (parsed?.default) return parsed.default as string;
    } catch {
      // Fallback below.
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: claimsData, error: authError } = await authClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    const callerId = claimsData?.claims?.sub as string | undefined;
    if (authError || !callerId) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(supabaseUrl, getServiceKey());
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "super_admin")
      .maybeSingle();
    if (!roleData) return json({ error: "Apenas super admin pode testar o Asaas" }, 403);

    const body = await req.json().catch(() => ({}));
    const settingsKeys = ["asaas_api_key", "asaas_environment"];
    const { data: settings } = await supabase.from("system_settings").select("key, value").in("key", settingsKeys);
    const settingsMap: Record<string, string> = {};
    (settings || []).forEach((s: any) => { settingsMap[s.key] = s.value; });

    const apiKey = String(body.api_key || settingsMap.asaas_api_key || "").trim();
    const environment = String(body.environment || settingsMap.asaas_environment || "sandbox");
    if (!apiKey) return json({ error: "Informe a API Key do Asaas." }, 400);

    const baseUrl = environment === "production"
      ? "https://api.asaas.com/api"
      : "https://sandbox.asaas.com/api";

    const testRes = await fetch(`${baseUrl}/v3/customers?limit=1&offset=0`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        access_token: apiKey,
      },
    });
    const data = await testRes.json().catch(() => null);

    if (!testRes.ok) {
      return json({
        ok: false,
        error: data?.errors?.[0]?.description || data?.message || "Falha ao validar API Key do Asaas.",
        status: testRes.status,
      }, 400);
    }

    return json({
      ok: true,
      environment,
      account: data?.data ? "connected" : "connected",
    });
  } catch (error) {
    console.error("Asaas test error:", error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
