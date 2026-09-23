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

const authedUserId = async (req: Request, supabaseUrl: string, anonKey: string) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await authClient.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub as string;
};

const loadSettings = async (supabase: any, keys: string[]) => {
  const { data } = await supabase
    .from("system_settings")
    .select("key, value")
    .in("key", keys);
  const map: Record<string, string> = {};
  (data || []).forEach((s: any) => {
    map[s.key] = s.value;
  });
  return map;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userId = await authedUserId(req, supabaseUrl, anonKey);
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const metadata = {
      user_id: userId,
      source: body?.source || "mv-connect",
      folder: body?.folder || null,
      filename: body?.filename || null,
    };

    const supabase = createClient(supabaseUrl, getServiceKey());
    const settings = await loadSettings(supabase, [
      "cloudflare_account_id",
      "cloudflare_images_token",
      "cloudflare_images_hash",
      "cloudflare_images_variant",
    ]);

    const accountId = settings.cloudflare_account_id || Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const apiToken = settings.cloudflare_images_token || Deno.env.get("CLOUDFLARE_IMAGES_TOKEN");
    const accountHash = settings.cloudflare_images_hash || Deno.env.get("CLOUDFLARE_IMAGES_HASH");
    const variant = settings.cloudflare_images_variant || Deno.env.get("CLOUDFLARE_IMAGES_VARIANT") || "public";

    if (!accountId || !apiToken || !accountHash) {
      return json({
        error: "Cloudflare Images não configurado. Informe Account ID, API Token e Account Hash.",
      }, 400);
    }

    const form = new FormData();
    form.set("requireSignedURLs", "false");
    form.set("metadata", JSON.stringify(metadata));

    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v2/direct_upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiToken}` },
      body: form,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success || !data?.result?.uploadURL || !data?.result?.id) {
      console.error("Cloudflare direct upload error:", data);
      return json({ error: "Erro ao criar upload no Cloudflare Images", details: data }, 500);
    }

    const imageId = data.result.id as string;
    return json({
      id: imageId,
      uploadURL: data.result.uploadURL,
      deliveryUrl: `https://imagedelivery.net/${accountHash}/${imageId}/${variant}`,
    });
  } catch (error) {
    console.error("cloudflare-direct-upload error:", error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
