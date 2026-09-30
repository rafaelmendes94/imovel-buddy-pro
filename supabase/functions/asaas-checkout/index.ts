import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const transparentPixel =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl9sAAAAASUVORK5CYII=";

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

const asaasError = (payload: any, fallback: string) =>
  payload?.errors?.map((item: any) => item.description).filter(Boolean).join(" ") ||
  payload?.message ||
  fallback;

const dateInSaoPaulo = (offsetDays = 0) => {
  const date = new Date(Date.now() + offsetDays * 86400000);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
};

const getPixPayment = async (
  baseUrl: string,
  headers: Record<string, string>,
  subscriptionId: string,
) => {
  const paymentsResponse = await fetch(
    `${baseUrl}/v3/subscriptions/${subscriptionId}/payments?limit=1`,
    { headers },
  );
  const paymentsData = await paymentsResponse.json();
  const payment = paymentsData?.data?.[0];
  if (!paymentsResponse.ok || !payment?.id) {
    throw new Error(asaasError(paymentsData, "O Pix ainda não está disponível."));
  }

  const pixResponse = await fetch(`${baseUrl}/v3/payments/${payment.id}/pixQrCode`, {
    headers,
  });
  const pixData = await pixResponse.json();
  if (!pixResponse.ok) {
    throw new Error(asaasError(pixData, "Não foi possível gerar o QR Code Pix."));
  }

  return {
    paymentId: payment.id as string,
    invoiceUrl: payment.invoiceUrl || payment.bankSlipUrl || null,
    pix: {
      encodedImage: pixData.encodedImage,
      payload: pixData.payload,
      expirationDate: pixData.expirationDate,
    },
  };
};

export const handler = async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authError } = await authClient.auth.getClaims(token);
    if (authError || !claimsData?.claims?.sub) return json({ error: "Unauthorized" }, 401);

    const userId = claimsData.claims.sub as string;
    const body = await req.json();
    const planId = String(body?.plan_id || "");
    const paymentMethod = String(body?.payment_method || "CREDIT_CARD").toUpperCase();
    const cpfCnpj = String(body?.cpf_cnpj || "").replace(/\D/g, "");

    if (!planId) return json({ error: "plan_id required" }, 400);
    if (!["CREDIT_CARD", "PIX"].includes(paymentMethod)) {
      return json({ error: "Forma de pagamento inválida" }, 400);
    }
    if (cpfCnpj && ![11, 14].includes(cpfCnpj.length)) {
      return json({ error: "Informe um CPF ou CNPJ válido." }, 400);
    }

    const supabase = createClient(supabaseUrl, getServiceKey());
    const { data: settings } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["asaas_api_key", "asaas_environment"]);
    const settingsMap: Record<string, string> = {};
    (settings || []).forEach((setting: any) => {
      settingsMap[setting.key] = setting.value;
    });

    const apiKey = settingsMap.asaas_api_key;
    const environment = settingsMap.asaas_environment || "sandbox";
    if (!apiKey) return json({ error: "Asaas não configurado no painel administrativo." }, 503);

    const baseUrl = environment === "production"
      ? "https://api.asaas.com"
      : "https://api-sandbox.asaas.com";
    const asaasHeaders = { "Content-Type": "application/json", access_token: apiKey };

    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("id", planId)
      .eq("is_active", true)
      .single();
    if (planError || !plan) return json({ error: "Plano não encontrado ou inativo." }, 404);
    if (plan.is_free || Number(plan.price) <= 0) {
      return json({ error: "Este plano não exige checkout de pagamento." }, 400);
    }

    let { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile) {
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      const metadata = authUser?.user?.user_metadata || {};
      const { data: insertedProfile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          user_id: userId,
          full_name: metadata.full_name || "",
          email: authUser?.user?.email || "",
          phone: metadata.phone || null,
          account_type: metadata.account_type || plan.plan_type || "corretor",
          approval_status: "pending",
        })
        .select("*")
        .single();
      if (profileError || !insertedProfile) return json({ error: "Perfil não encontrado." }, 404);
      profile = insertedProfile;
    }

    if (plan.plan_type && plan.plan_type !== "ambos" && profile.account_type !== plan.plan_type) {
      await supabase.from("profiles").update({ account_type: plan.plan_type }).eq("user_id", userId);
      profile = { ...profile, account_type: plan.plan_type };
    }

    await supabase.from("user_roles").upsert({
      user_id: userId,
      role: profile.account_type === "parceiro" ? "partner" : "broker",
    }, { onConflict: "user_id,role" });

    const { data: billing } = await supabase
      .from("billing_customers")
      .select("asaas_customer_id")
      .eq("user_id", userId)
      .maybeSingle();
    let customerId = billing?.asaas_customer_id as string | null;

    if (!customerId) {
      const customerResponse = await fetch(`${baseUrl}/v3/customers`, {
        method: "POST",
        headers: asaasHeaders,
        body: JSON.stringify({
          name: profile.full_name || "Cliente",
          email: profile.email,
          phone: profile.phone || undefined,
          cpfCnpj: cpfCnpj || undefined,
          externalReference: userId,
          notificationDisabled: false,
        }),
      });
      const customerData = await customerResponse.json();
      if (!customerResponse.ok) {
        return json({ error: asaasError(customerData, "Erro ao criar cliente no Asaas.") }, 400);
      }
      customerId = customerData.id;
      await supabase.from("billing_customers").upsert({
        user_id: userId,
        asaas_customer_id: customerId,
      }, { onConflict: "user_id" });
    } else if (cpfCnpj) {
      const updateCustomerResponse = await fetch(`${baseUrl}/v3/customers/${customerId}`, {
        method: "PUT",
        headers: asaasHeaders,
        body: JSON.stringify({ cpfCnpj }),
      });
      if (!updateCustomerResponse.ok) {
        const updateCustomerData = await updateCustomerResponse.json();
        return json({ error: asaasError(updateCustomerData, "Não foi possível atualizar o CPF/CNPJ no Asaas.") }, 400);
      }
    }

    const cycleMap: Record<string, string> = {
      monthly: "MONTHLY",
      quarterly: "QUARTERLY",
      semiannual: "SEMIANNUALLY",
      annual: "YEARLY",
    };
    const billingCycle = cycleMap[plan.billing_cycle] || "MONTHLY";
    const dueDate = dateInSaoPaulo();
    const externalReference = JSON.stringify({ user_id: userId, plan_id: planId });

    let { data: localSubscription } = await supabase
      .from("subscriptions")
      .select("id, plan_id, status, asaas_subscription_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const reusablePixSubscriptionId = paymentMethod === "PIX" &&
        localSubscription?.plan_id === planId &&
        localSubscription?.status === "pending_payment"
      ? localSubscription.asaas_subscription_id as string | null
      : null;

    const pendingSubscription = {
      user_id: userId,
      plan_id: planId,
      status: "pending_payment",
      current_period_start: new Date().toISOString(),
      current_period_end: null,
      blocked_at: null,
      trial_ends_at: null,
      asaas_subscription_id: reusablePixSubscriptionId,
    };

    if (localSubscription) {
      await supabase.from("subscriptions").update(pendingSubscription).eq("id", localSubscription.id);
    } else {
      const { data: insertedSubscription, error: subscriptionError } = await supabase
        .from("subscriptions")
        .insert(pendingSubscription)
        .select("id")
        .single();
      if (subscriptionError) return json({ error: "Não foi possível preparar a assinatura." }, 500);
      localSubscription = insertedSubscription;
    }

    const checkoutOrigin = Deno.env.get("SITE_URL") || req.headers.get("origin") || "https://mvbrokerconnect.com.br";
    const callbackBase = `${checkoutOrigin}/checkout?plan_id=${encodeURIComponent(planId)}`;

    if (paymentMethod === "CREDIT_CARD") {
      const checkoutResponse = await fetch(`${baseUrl}/v3/checkouts`, {
        method: "POST",
        headers: asaasHeaders,
        body: JSON.stringify({
          billingTypes: ["CREDIT_CARD"],
          chargeTypes: ["RECURRENT"],
          minutesToExpire: 60,
          externalReference,
          customer: customerId,
          callback: {
            successUrl: `${callbackBase}&checkout=success`,
            cancelUrl: `${callbackBase}&checkout=cancelled`,
            expiredUrl: `${callbackBase}&checkout=expired`,
          },
          items: [{
            name: String(plan.name || "Plano MV Broker").slice(0, 30),
            description: `Assinatura ${plan.name}`.slice(0, 150),
            quantity: 1,
            value: Number(plan.price),
            imageBase64: transparentPixel,
            externalReference: planId,
          }],
          subscription: { cycle: billingCycle, nextDueDate: dueDate },
        }),
      });
      const checkoutData = await checkoutResponse.json();
      if (!checkoutResponse.ok) {
        return json({ error: asaasError(checkoutData, "Erro ao criar checkout no Asaas.") }, 400);
      }

      const checkoutUrl = checkoutData.link || (
        environment === "production"
          ? `https://asaas.com/checkoutSession/show?id=${checkoutData.id}`
          : `https://sandbox.asaas.com/checkoutSession/show?id=${checkoutData.id}`
      );
      return json({
        paymentMethod,
        checkoutUrl,
        checkoutId: checkoutData.id,
        status: "pending_payment",
      });
    }

    if (reusablePixSubscriptionId) {
      try {
        const existingPix = await getPixPayment(baseUrl, asaasHeaders, reusablePixSubscriptionId);
        return json({
          paymentMethod,
          status: "pending_payment",
          subscriptionId: reusablePixSubscriptionId,
          ...existingPix,
        });
      } catch (error) {
        console.warn("Existing Pix subscription could not be reused:", error);
      }
    }

    const subscriptionResponse = await fetch(`${baseUrl}/v3/subscriptions`, {
      method: "POST",
      headers: asaasHeaders,
      body: JSON.stringify({
        customer: customerId,
        billingType: "PIX",
        value: Number(plan.price),
        nextDueDate: dueDate,
        cycle: billingCycle,
        description: `MV BROKER CONNECT - ${plan.name}`,
        externalReference,
      }),
    });
    const subscriptionData = await subscriptionResponse.json();
    if (!subscriptionResponse.ok) {
      return json({ error: asaasError(subscriptionData, "Erro ao criar assinatura Pix no Asaas.") }, 400);
    }

    await supabase.from("subscriptions").update({
      asaas_subscription_id: subscriptionData.id,
    }).eq("id", localSubscription!.id);

    const createdPix = await getPixPayment(baseUrl, asaasHeaders, subscriptionData.id);

    return json({
      paymentMethod,
      status: "pending_payment",
      subscriptionId: subscriptionData.id,
      ...createdPix,
    });
  } catch (error) {
    console.error("Asaas checkout error:", error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
};

if (import.meta.main) serve(handler);
