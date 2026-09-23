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
    const supabase = createClient(supabaseUrl, getServiceKey());
    const settings = await loadSettings(supabase, [
      "cloudflare_account_id",
      "cloudflare_stream_token",
      "cloudflare_images_token",
    ]);

    const accountId = settings.cloudflare_account_id || Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const apiToken =
      settings.cloudflare_stream_token ||
      settings.cloudflare_images_token ||
      Deno.env.get("CLOUDFLARE_STREAM_TOKEN") ||
      Deno.env.get("CLOUDFLARE_IMAGES_TOKEN");

    if (!accountId || !apiToken) {
      return json({
        error: "Cloudflare Stream não configurado. Informe Account ID e API Token com permissão de Stream.",
      }, 400);
    }

    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maxDurationSeconds: Math.max(1, Number(body?.maxDurationSeconds || 3600)),
        requireSignedURLs: false,
        meta: {
          name: body?.filename || "video",
          folder: body?.folder || "",
          source: body?.source || "mv-connect",
          user_id: userId,
        },
      }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success || !data?.result?.uploadURL || !data?.result?.uid) {
      console.error("Cloudflare Stream direct upload error:", data);
      return json({ error: "Erro ao criar upload no Cloudflare Stream", details: data }, 500);
    }

    const uid = data.result.uid as string;
    return json({
      uid,
      uploadURL: data.result.uploadURL,
      iframeUrl: `https://iframe.videodelivery.net/${uid}`,
      thumbnailUrl: `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg?time=1s`,
    });
  } catch (error) {
    console.error("cloudflare-stream-direct-upload error:", error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
