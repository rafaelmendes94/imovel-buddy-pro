import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Asaas webhook received:", JSON.stringify(body));

    const { event, payment } = body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Only process payment events
    const paymentEvents = [
      "PAYMENT_CONFIRMED",
      "PAYMENT_RECEIVED",
      "PAYMENT_OVERDUE",
      "PAYMENT_REFUNDED",
      "PAYMENT_DELETED",
    ];

    if (!paymentEvents.includes(event)) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!payment?.externalReference) {
      console.log("No external reference, skipping");
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let externalRef: { user_id: string; plan_id: string };
    try {
      externalRef = JSON.parse(payment.externalReference);
    } catch {
      // Try subscription-level externalReference
      if (payment.subscription) {
        // Get Asaas settings
        const { data: settings } = await supabase
          .from("system_settings")
          .select("key, value")
          .in("key", ["asaas_api_key", "asaas_environment"]);

        const settingsMap: Record<string, string> = {};
        (settings || []).forEach((s: any) => { settingsMap[s.key] = s.value; });

        const apiKey = settingsMap["asaas_api_key"];
        const environment = settingsMap["asaas_environment"] || "sandbox";
        const baseUrl = environment === "production"
          ? "https://api.asaas.com/api"
          : "https://sandbox.asaas.com/api";

        const subRes = await fetch(`${baseUrl}/v3/subscriptions/${payment.subscription}`, {
          headers: { "access_token": apiKey },
        });
        const subData = await subRes.json();

        if (subData.externalReference) {
          try {
            externalRef = JSON.parse(subData.externalReference);
          } catch {
            console.error("Invalid subscription externalReference");
            return new Response(JSON.stringify({ ok: true }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } else {
          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        console.error("Invalid externalReference:", payment.externalReference);
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const now = new Date();

    if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
      const periodEnd = new Date(now.getTime() + 30 * 86400000);

      // Find or create subscription
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", externalRef.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSub) {
        await supabase.from("subscriptions").update({
          status: "active",
          plan_id: externalRef.plan_id,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          blocked_at: null,
          mercado_pago_subscription_id: payment.subscription || String(payment.id),
        }).eq("id", existingSub.id);

        await supabase.from("subscription_payments").insert({
          subscription_id: existingSub.id,
          amount: payment.value,
          status: "approved",
          mercado_pago_payment_id: String(payment.id),
          paid_at: now.toISOString(),
          reference_period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
        });
      } else {
        const { data: newSub } = await supabase.from("subscriptions").insert({
          user_id: externalRef.user_id,
          plan_id: externalRef.plan_id,
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          mercado_pago_subscription_id: payment.subscription || String(payment.id),
        }).select("id").single();

        if (newSub) {
          await supabase.from("subscription_payments").insert({
            subscription_id: newSub.id,
            amount: payment.value,
            status: "approved",
            mercado_pago_payment_id: String(payment.id),
            paid_at: now.toISOString(),
            reference_period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
          });
        }
      }
    } else if (event === "PAYMENT_OVERDUE") {
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", externalRef.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSub) {
        await supabase.from("subscriptions").update({
          status: "overdue",
        }).eq("id", existingSub.id);
      }
    } else if (event === "PAYMENT_REFUNDED" || event === "PAYMENT_DELETED") {
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", externalRef.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSub) {
        await supabase.from("subscriptions").update({
          status: "cancelled",
        }).eq("id", existingSub.id);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Asaas webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
