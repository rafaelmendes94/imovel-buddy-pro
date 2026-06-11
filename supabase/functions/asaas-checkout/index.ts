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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: claimsData, error: authErr } = await authClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (authErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const user_id = claimsData.claims.sub as string;

    const { plan_id } = await req.json();

    if (!plan_id) {
      return new Response(JSON.stringify({ error: "plan_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Asaas settings from system_settings
    const { data: settings } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["asaas_api_key", "asaas_environment"]);

    const settingsMap: Record<string, string> = {};
    (settings || []).forEach((s: any) => { settingsMap[s.key] = s.value; });

    const apiKey = settingsMap["asaas_api_key"];
    const environment = settingsMap["asaas_environment"] || "sandbox";

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Asaas não configurado. Configure a API Key nas opções do sistema.", init_point: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = environment === "production"
      ? "https://api.asaas.com/api"
      : "https://sandbox.asaas.com/api";

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("id", plan_id)
      .single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: "Plano não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Perfil não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const asaasHeaders = {
      "Content-Type": "application/json",
      "access_token": apiKey,
    };

    // Lookup billing customer in separate table (sensitive payment IDs are not in profiles)
    const { data: billing } = await supabase
      .from("billing_customers")
      .select("asaas_customer_id")
      .eq("user_id", user_id)
      .maybeSingle();
    let customerId = billing?.asaas_customer_id as string | null;

    // Create customer if not exists
    if (!customerId) {
      const customerRes = await fetch(`${baseUrl}/v3/customers`, {
        method: "POST",
        headers: asaasHeaders,
        body: JSON.stringify({
          name: profile.full_name || "Cliente",
          email: profile.email,
          phone: profile.phone || undefined,
          externalReference: user_id,
        }),
      });

      const customerData = await customerRes.json();

      if (!customerRes.ok) {
        console.error("Asaas customer error:", customerData);
        return new Response(JSON.stringify({ error: "Erro ao criar cliente no Asaas", details: customerData }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      customerId = customerData.id;

      // Save asaas_customer_id in dedicated billing table
      await supabase
        .from("billing_customers")
        .upsert({ user_id, asaas_customer_id: customerId }, { onConflict: "user_id" });
    }

    // Map billing cycle to Asaas cycle
    const cycleMap: Record<string, string> = {
      monthly: "MONTHLY",
      quarterly: "QUARTERLY",
      annual: "YEARLY",
    };

    const billingCycle = cycleMap[plan.billing_cycle] || "MONTHLY";

    // Create subscription in Asaas
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1);
    const dueDateStr = nextDueDate.toISOString().split("T")[0];

    const subscriptionRes = await fetch(`${baseUrl}/v3/subscriptions`, {
      method: "POST",
      headers: asaasHeaders,
      body: JSON.stringify({
        customer: customerId,
        billingType: "UNDEFINED", // Let customer choose payment method
        value: Number(plan.price),
        nextDueDate: dueDateStr,
        cycle: billingCycle,
        description: `MV BROKER CONNECT - ${plan.name}`,
        externalReference: JSON.stringify({ user_id, plan_id }),
      }),
    });

    const subscriptionData = await subscriptionRes.json();

    if (!subscriptionRes.ok) {
      console.error("Asaas subscription error:", subscriptionData);
      return new Response(JSON.stringify({ error: "Erro ao criar assinatura no Asaas", details: subscriptionData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the first payment invoice URL
    let invoiceUrl = null;
    if (subscriptionData.id) {
      const paymentsRes = await fetch(`${baseUrl}/v3/subscriptions/${subscriptionData.id}/payments`, {
        headers: asaasHeaders,
      });
      const paymentsData = await paymentsRes.json();

      if (paymentsData.data && paymentsData.data.length > 0) {
        invoiceUrl = paymentsData.data[0].invoiceUrl;
      }
    }

    return new Response(JSON.stringify({
      invoiceUrl,
      subscription_id: subscriptionData.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
