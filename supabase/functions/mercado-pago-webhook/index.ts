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
    console.log("Webhook received:", JSON.stringify(body));

    // Mercado Pago sends topic and id
    const { type, data } = body;

    if (type !== "payment") {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!MERCADO_PAGO_ACCESS_TOKEN) {
      console.error("MERCADO_PAGO_ACCESS_TOKEN not set");
      return new Response(JSON.stringify({ error: "Not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch payment details from Mercado Pago
    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { Authorization: `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}` },
    });
    const payment = await paymentRes.json();
    console.log("Payment details:", JSON.stringify(payment));

    if (!paymentRes.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch payment" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse external_reference
    let externalRef: { user_id: string; plan_id: string };
    try {
      externalRef = JSON.parse(payment.external_reference);
    } catch {
      console.error("Invalid external_reference:", payment.external_reference);
      return new Response(JSON.stringify({ error: "Invalid reference" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (payment.status === "approved") {
      // Find or create subscription
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", externalRef.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 86400000);

      if (existingSub) {
        await supabase.from("subscriptions").update({
          status: "active",
          plan_id: externalRef.plan_id,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          blocked_at: null,
          mercado_pago_subscription_id: String(data.id),
        }).eq("id", existingSub.id);

        // Record payment
        await supabase.from("subscription_payments").insert({
          subscription_id: existingSub.id,
          amount: payment.transaction_amount,
          status: "approved",
          mercado_pago_payment_id: String(data.id),
          paid_at: now.toISOString(),
          reference_period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
        });
      } else {
        // Create new subscription
        const { data: newSub } = await supabase.from("subscriptions").insert({
          user_id: externalRef.user_id,
          plan_id: externalRef.plan_id,
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          mercado_pago_subscription_id: String(data.id),
        }).select("id").single();

        if (newSub) {
          await supabase.from("subscription_payments").insert({
            subscription_id: newSub.id,
            amount: payment.transaction_amount,
            status: "approved",
            mercado_pago_payment_id: String(data.id),
            paid_at: now.toISOString(),
            reference_period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
          });
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
