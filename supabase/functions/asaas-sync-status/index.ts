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
      // Fall through to the legacy service role key.
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
};

const getUserId = async (req: Request, supabaseUrl: string, anonKey: string) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await authClient.auth.getClaims(authHeader.slice(7));
  return error ? null : data?.claims?.sub as string | null;
};

const loadSettings = async (supabase: any) => {
  const { data } = await supabase
    .from("system_settings")
    .select("key, value")
    .in("key", ["asaas_api_key", "asaas_environment"]);
  return Object.fromEntries((data || []).map((item: any) => [item.key, item.value])) as Record<string, string>;
};

const paidStatuses = new Set(["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH", "DUNNING_RECEIVED"]);

export const handler = async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userId = await getUserId(req, supabaseUrl, anonKey);
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(supabaseUrl, getServiceKey());
    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("id, plan_id, status, asaas_subscription_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError) throw subscriptionError;
    if (!subscription?.asaas_subscription_id) {
      return json({ status: subscription?.status || "not_found", synced: false });
    }
    if (subscription.status === "active" || subscription.status === "trial") {
      return json({ status: subscription.status, synced: false });
    }

    const settings = await loadSettings(supabase);
    const apiKey = settings.asaas_api_key;
    if (!apiKey) return json({ error: "Asaas não configurado" }, 503);
    const baseUrl = settings.asaas_environment === "production"
      ? "https://api.asaas.com"
      : "https://api-sandbox.asaas.com";

    const paymentsResponse = await fetch(
      `${baseUrl}/v3/subscriptions/${subscription.asaas_subscription_id}/payments?limit=20`,
      { headers: { access_token: apiKey } },
    );
    const paymentsData = await paymentsResponse.json();
    if (!paymentsResponse.ok) {
      console.error("Asaas subscription reconciliation failed:", paymentsData);
      return json({ error: "Não foi possível consultar o pagamento no Asaas" }, 502);
    }

    const payment = (paymentsData?.data || []).find((item: any) => paidStatuses.has(item.status));
    if (!payment) return json({ status: subscription.status, synced: false });

    const { data: plan } = await supabase
      .from("plans")
      .select("billing_cycle")
      .eq("id", subscription.plan_id)
      .maybeSingle();
    const days = plan?.billing_cycle === "annual" ? 365
      : plan?.billing_cycle === "semiannual" ? 180
      : plan?.billing_cycle === "quarterly" ? 90
      : 30;
    const now = new Date();
    const periodEnd = new Date(now.getTime() + days * 86400000);

    const { error: updateError } = await supabase.from("subscriptions").update({
      status: "active",
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      blocked_at: null,
    }).eq("id", subscription.id).eq("user_id", userId);
    if (updateError) throw updateError;

    const paymentRecord = {
      subscription_id: subscription.id,
      amount: Number(payment.value || 0),
      status: "approved",
      asaas_payment_id: String(payment.id),
      paid_at: payment.paymentDate ? `${payment.paymentDate}T12:00:00.000Z` : now.toISOString(),
      reference_period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    };
    const { data: existingPayment } = await supabase
      .from("subscription_payments")
      .select("id")
      .eq("asaas_payment_id", paymentRecord.asaas_payment_id)
      .maybeSingle();
    const paymentResult = existingPayment
      ? await supabase.from("subscription_payments").update(paymentRecord).eq("id", existingPayment.id)
      : await supabase.from("subscription_payments").insert(paymentRecord);
    if (paymentResult.error) throw paymentResult.error;

    const { error: profileError } = await supabase.from("profiles").update({
      approval_status: "approved",
      rejection_reason: null,
      approved_at: now.toISOString(),
    }).eq("user_id", userId);
    if (profileError) throw profileError;

    return json({ status: "active", synced: true });
  } catch (error) {
    console.error("Asaas reconciliation error:", error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
};

if (import.meta.main) serve(handler);
