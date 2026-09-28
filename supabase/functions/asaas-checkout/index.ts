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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: claimsData, error: authErr } = await authClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (authErr || !claimsData?.claims?.sub) return json({ error: "Unauthorized" }, 401);

    const user_id = claimsData.claims.sub as string;
    const { plan_id } = await req.json();
    if (!plan_id) return json({ error: "plan_id required" }, 400);

    const supabase = createClient(supabaseUrl, getServiceKey());
    const { data: settings } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["asaas_api_key", "asaas_environment"]);

    const settingsMap: Record<string, string> = {};
    (settings || []).forEach((s: any) => { settingsMap[s.key] = s.value; });

    const apiKey = settingsMap.asaas_api_key;
    const environment = settingsMap.asaas_environment || "sandbox";
    if (!apiKey) {
      return json({ error: "Asaas não configurado. Configure a API Key nas opções do sistema.", init_point: null });
    }

    const baseUrl = environment === "production"
      ? "https://api.asaas.com"
      : "https://api-sandbox.asaas.com";

    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("id", plan_id)
      .single();
    if (planError || !plan) return json({ error: "Plano não encontrado" }, 404);

    let { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    if (!profile) {
      const { data: authUser } = await supabase.auth.admin.getUserById(user_id);
      const meta = authUser?.user?.user_metadata || {};
      const { data: insertedProfile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          user_id,
          full_name: meta.full_name || "",
          email: authUser?.user?.email || "",
          phone: meta.phone || null,
          account_type: meta.account_type || plan.plan_type || "corretor",
          approval_status: "pending",
        })
        .select("*")
        .single();
      if (profileError || !insertedProfile) {
        return json({ error: "Perfil não encontrado", details: profileError }, 404);
      }
      profile = insertedProfile;
    }

    if (plan.plan_type && plan.plan_type !== "ambos" && profile.account_type !== plan.plan_type) {
      await supabase.from("profiles").update({ account_type: plan.plan_type }).eq("user_id", user_id);
      profile = { ...profile, account_type: plan.plan_type };
    }

    await supabase
      .from("user_roles")
      .upsert({
        user_id,
        role: profile.account_type === "parceiro" ? "partner" : "broker",
      }, { onConflict: "user_id,role" });

    const asaasHeaders = {
      "Content-Type": "application/json",
      "access_token": apiKey,
    };

    const { data: billing } = await supabase
      .from("billing_customers")
      .select("asaas_customer_id")
      .eq("user_id", user_id)
      .maybeSingle();
    let customerId = billing?.asaas_customer_id as string | null;

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
        return json({ error: "Erro ao criar cliente no Asaas", details: customerData }, 500);
      }
      customerId = customerData.id;
      await supabase
        .from("billing_customers")
        .upsert({ user_id, asaas_customer_id: customerId }, { onConflict: "user_id" });
    }

    const cycleMap: Record<string, string> = {
      monthly: "MONTHLY",
      quarterly: "QUARTERLY",
      semiannual: "SEMIANNUALLY",
      annual: "YEARLY",
    };
    const billingCycle = cycleMap[plan.billing_cycle] || "MONTHLY";
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1);
    const dueDateStr = nextDueDate.toISOString().split("T")[0];

    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const pendingSubscription = {
      user_id,
      plan_id,
      status: "pending_payment",
      current_period_start: new Date().toISOString(),
      current_period_end: null,
      blocked_at: null,
      trial_ends_at: null,
      asaas_subscription_id: null,
    };

    if (existingSub) {
      await supabase.from("subscriptions").update(pendingSubscription).eq("id", existingSub.id);
    } else {
      await supabase.from("subscriptions").insert(pendingSubscription);
    }

    const checkoutOrigin =
      req.headers.get("origin") ||
      Deno.env.get("SITE_URL") ||
      "https://mvbrokerconnect.com.br";

    const checkoutRes = await fetch(`${baseUrl}/v3/checkouts`, {
      method: "POST",
      headers: asaasHeaders,
      body: JSON.stringify({
        billingTypes: ["PIX", "CREDIT_CARD"],
        chargeTypes: ["RECURRENT"],
        minutesToExpire: 1440,
        externalReference: JSON.stringify({ user_id, plan_id }),
        callback: {
          successUrl: `${checkoutOrigin}/painel/assinatura?checkout=success`,
          cancelUrl: `${checkoutOrigin}/painel/assinatura?checkout=cancelled`,
          expiredUrl: `${checkoutOrigin}/painel/assinatura?checkout=expired`,
        },
        customer: customerId,
        items: [
          {
            name: plan.name,
            description: `MV BROKER CONNECT - ${plan.name}`,
            quantity: 1,
            value: Number(plan.price),
          },
        ],
        subscription: {
          cycle: billingCycle,
          nextDueDate: dueDateStr,
        },
      }),
    });
    const checkoutData = await checkoutRes.json();

    if (!checkoutRes.ok) {
      console.error("Asaas checkout error:", checkoutData);
      return json({ error: "Erro ao criar checkout recorrente no Asaas", details: checkoutData }, 500);
    }

    return json({
      invoiceUrl: checkoutData.link || checkoutData.url || (checkoutData.id ? `https://asaas.com/checkoutSession/show?id=${checkoutData.id}` : null),
      checkout_id: checkoutData.id,
    });
  } catch (error) {
    console.error("Asaas checkout error:", error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
