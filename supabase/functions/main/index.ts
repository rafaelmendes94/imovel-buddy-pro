import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handler as propertyFeed } from "../property-feed/index.ts";
import { handler as generateDescription } from "../generate-description/index.ts";
import { handler as propertyValuation } from "../property-valuation/index.ts";
import { handler as generateContract } from "../generate-contract/index.ts";
import { handler as sharkAi } from "../shark-ai/index.ts";
import { handler as parseImovelIa } from "../parse-imovel-ia/index.ts";
import { handler as parseTabelaPdfIa } from "../parse-tabela-pdf-ia/index.ts";

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

const getFunctionName = (req: Request) => {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.findIndex((p) => p === "v1");
  return idx >= 0 ? parts[idx + 1] || "main" : parts.at(-1) || "main";
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
  (data || []).forEach((s: any) => { map[s.key] = s.value; });
  return map;
};

const cloudflareDirectUpload = async (req: Request) => {
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
};

const cloudflareStreamDirectUpload = async (req: Request) => {
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
};

const DEFAULT_STAFF_PERMISSIONS = {
  dashboard_admin: { view: false, create: false, edit: false, delete: false },
  funcionarios: { view: false, create: false, edit: false, delete: false },
  clientes: { view: false, create: false, edit: false, delete: false },
  planos: { view: false, create: false, edit: false, delete: false },
  brick: { view: false, create: false, edit: false, delete: false },
  dashboard: { view: false, create: false, edit: false, delete: false },
  relatorios: { view: false, create: false, edit: false, delete: false },
  site_editor: { view: false, create: false, edit: false, delete: false },
  imoveis: { view: false, create: false, edit: false, delete: false },
  edificios: { view: false, create: false, edit: false, delete: false },
  condominios: { view: false, create: false, edit: false, delete: false },
  fotos_cidade: { view: false, create: false, edit: false, delete: false },
  avaliacoes: { view: false, create: false, edit: false, delete: false },
  financeiro: { view: false, create: false, edit: false, delete: false },
  tabelas: { view: false, create: false, edit: false, delete: false },
  contratos: { view: false, create: false, edit: false, delete: false },
  material_extra: { view: false, create: false, edit: false, delete: false },
  corretores: { view: false, create: false, edit: false, delete: false },
  imobiliarias: { view: false, create: false, edit: false, delete: false },
  configuracoes: { view: false, create: false, edit: false, delete: false },
};

async function requireSuperAdmin(req: Request, supabaseUrl: string, anonKey: string) {
  const callerId = await authedUserId(req, supabaseUrl, anonKey);
  if (!callerId) return { error: json({ error: "Unauthorized" }, 401) };

  const supabaseAdmin = createClient(supabaseUrl, getServiceKey());
  const { data: roleData } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", callerId)
    .eq("role", "super_admin")
    .maybeSingle();

  if (!roleData) return { error: json({ error: "Apenas super admin pode executar esta ação" }, 403) };
  return { callerId, supabaseAdmin };
}

async function recordAsaasPayment(supabase: any, payload: {
  subscription_id: string;
  amount: number;
  status: string;
  asaas_payment_id: string;
  paid_at: string;
  reference_period: string;
}) {
  const { data: existingPayment, error: lookupError } = await supabase
    .from("subscription_payments")
    .select("id")
    .eq("asaas_payment_id", payload.asaas_payment_id)
    .maybeSingle();

  if (lookupError) throw lookupError;

  const data = {
    subscription_id: payload.subscription_id,
    amount: payload.amount,
    status: payload.status,
    asaas_payment_id: payload.asaas_payment_id,
    paid_at: payload.paid_at,
    reference_period: payload.reference_period,
  };

  const result = existingPayment
    ? await supabase.from("subscription_payments").update(data).eq("id", existingPayment.id)
    : await supabase.from("subscription_payments").insert(data);

  if (result.error) throw result.error;
}

async function asaasCheckout(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userId = await authedUserId(req, supabaseUrl, anonKey);
  if (!userId) return json({ error: "Unauthorized" }, 401);

  const { plan_id } = await req.json();
  if (!plan_id) return json({ error: "plan_id required" }, 400);

  const supabase = createClient(supabaseUrl, getServiceKey());
  const settings = await loadSettings(supabase, ["asaas_api_key", "asaas_environment"]);
  const apiKey = settings.asaas_api_key;
  const environment = settings.asaas_environment || "sandbox";

  if (!apiKey) {
    return json({ error: "Asaas não configurado. Configure a API Key nas opções do sistema.", init_point: null });
  }

  const baseUrl = environment === "production"
    ? "https://api.asaas.com/api"
    : "https://sandbox.asaas.com/api";

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("*")
    .eq("id", plan_id)
    .single();
  if (planError || !plan) return json({ error: "Plano não encontrado" }, 404);

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (!profile) return json({ error: "Perfil não encontrado" }, 404);

  const asaasHeaders = { "Content-Type": "application/json", access_token: apiKey };
  const { data: billing } = await supabase
    .from("billing_customers")
    .select("asaas_customer_id")
    .eq("user_id", userId)
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
        externalReference: userId,
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
      .upsert({ user_id: userId, asaas_customer_id: customerId }, { onConflict: "user_id" });
  }

  const cycleMap: Record<string, string> = {
    monthly: "MONTHLY",
    quarterly: "QUARTERLY",
    semiannual: "SEMIANNUALLY",
    annual: "YEARLY",
  };
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + 1);
  const dueDateStr = nextDueDate.toISOString().split("T")[0];
  const dueDateIso = `${dueDateStr}T12:00:00.000Z`;

  const subscriptionRes = await fetch(`${baseUrl}/v3/subscriptions`, {
    method: "POST",
    headers: asaasHeaders,
    body: JSON.stringify({
      customer: customerId,
      billingType: "UNDEFINED",
      value: Number(plan.price),
      nextDueDate: dueDateStr,
      cycle: cycleMap[plan.billing_cycle] || "MONTHLY",
      description: `MV BROKER CONNECT - ${plan.name}`,
      externalReference: JSON.stringify({ user_id: userId, plan_id }),
    }),
  });
  const subscriptionData = await subscriptionRes.json();
  if (!subscriptionRes.ok) {
    console.error("Asaas subscription error:", subscriptionData);
    return json({ error: "Erro ao criar assinatura no Asaas", details: subscriptionData }, 500);
  }

  if (subscriptionData.id) {
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSub) {
      await supabase.from("subscriptions").update({
        plan_id,
        status: "pending_payment",
        current_period_start: new Date().toISOString(),
        current_period_end: dueDateIso,
        blocked_at: null,
        trial_ends_at: null,
        asaas_subscription_id: subscriptionData.id,
      }).eq("id", existingSub.id);
    } else {
      await supabase.from("subscriptions").insert({
        user_id: userId,
        plan_id,
        status: "pending_payment",
        current_period_start: new Date().toISOString(),
        current_period_end: dueDateIso,
        asaas_subscription_id: subscriptionData.id,
      });
    }
  }

  let invoiceUrl = null;
  if (subscriptionData.id) {
    const paymentsRes = await fetch(`${baseUrl}/v3/subscriptions/${subscriptionData.id}/payments`, {
      headers: asaasHeaders,
    });
    const paymentsData = await paymentsRes.json();
    invoiceUrl = paymentsData?.data?.[0]?.invoiceUrl || null;
  }

  return json({ invoiceUrl, subscription_id: subscriptionData.id });
}

async function asaasTest(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const callerId = await authedUserId(req, supabaseUrl, anonKey);
  if (!callerId) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(supabaseUrl, getServiceKey());
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", callerId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (!roleData) return json({ error: "Apenas super admin pode testar o Asaas" }, 403);

  const body = await req.json().catch(() => ({}));
  const settings = await loadSettings(supabase, ["asaas_api_key", "asaas_environment"]);
  const apiKey = String(body.api_key || settings.asaas_api_key || "").trim();
  const environment = String(body.environment || settings.asaas_environment || "sandbox");
  if (!apiKey) return json({ error: "Informe a API Key do Asaas." }, 400);

  const baseUrl = environment === "production"
    ? "https://api.asaas.com/api"
    : "https://sandbox.asaas.com/api";
  const testRes = await fetch(`${baseUrl}/v3/customers?limit=1&offset=0`, {
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

  return json({ ok: true, environment });
}

async function asaasWebhook(req: Request) {
  const expectedToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
  if (expectedToken) {
    const provided = req.headers.get("asaas-access-token") || req.headers.get("Asaas-Access-Token");
    if (!provided || provided !== expectedToken) return json({ error: "Unauthorized" }, 401);
  }

  const body = await req.json();
  const { event, payment } = body;
  const paymentEvents = ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "PAYMENT_OVERDUE", "PAYMENT_REFUNDED", "PAYMENT_DELETED"];
  if (!paymentEvents.includes(event)) return json({ ok: true });
  if (!payment?.externalReference && !payment?.subscription) return json({ ok: true });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, getServiceKey());
  let externalRef: { user_id: string; plan_id: string } | null = null;

  if (payment.externalReference) {
    try {
      externalRef = JSON.parse(payment.externalReference);
    } catch {
      externalRef = null;
    }
  }

  if (!externalRef && payment.subscription) {
    const settings = await loadSettings(supabase, ["asaas_api_key", "asaas_environment"]);
    const apiKey = settings.asaas_api_key;
    if (!apiKey) return json({ ok: true, skipped: "asaas_not_configured" });
    const baseUrl = settings.asaas_environment === "production"
      ? "https://api.asaas.com/api"
      : "https://sandbox.asaas.com/api";
    const subRes = await fetch(`${baseUrl}/v3/subscriptions/${payment.subscription}`, {
      headers: { access_token: apiKey },
    });
    const subData = await subRes.json();
    if (subData.externalReference) {
      try {
        externalRef = JSON.parse(subData.externalReference);
      } catch {
        externalRef = null;
      }
    }
  }

  if (!externalRef?.user_id || !externalRef?.plan_id) return json({ ok: true, skipped: "no_external_reference" });

  const now = new Date();
  const getPeriodEnd = async (planId: string) => {
    const { data: plan } = await supabase.from("plans").select("billing_cycle").eq("id", planId).maybeSingle();
    const cycle = plan?.billing_cycle || "monthly";
    const days = cycle === "annual" ? 365 : cycle === "semiannual" ? 180 : cycle === "quarterly" ? 90 : 30;
    return new Date(now.getTime() + days * 86400000);
  };

  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("id, current_period_end, blocked_at")
    .eq("user_id", externalRef.user_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
    const periodEnd = await getPeriodEnd(externalRef.plan_id);
    let subscriptionId = existingSub?.id;
    if (subscriptionId) {
      await supabase.from("subscriptions").update({
        status: "active",
        plan_id: externalRef.plan_id,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        blocked_at: null,
        asaas_subscription_id: payment.subscription || String(payment.id),
      }).eq("id", subscriptionId);
    } else {
      const { data: newSub } = await supabase.from("subscriptions").insert({
        user_id: externalRef.user_id,
        plan_id: externalRef.plan_id,
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        asaas_subscription_id: payment.subscription || String(payment.id),
      }).select("id").single();
      subscriptionId = newSub?.id;
    }

    if (subscriptionId) {
      await recordAsaasPayment(supabase, {
        subscription_id: subscriptionId,
        amount: payment.value,
        status: "approved",
        asaas_payment_id: String(payment.id),
        paid_at: now.toISOString(),
        reference_period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      });
    }
  } else if (event === "PAYMENT_OVERDUE" && existingSub) {
    const periodEnd = existingSub.current_period_end ? new Date(existingSub.current_period_end) : null;
    const shouldBlock = periodEnd && (periodEnd.getTime() + 7 * 86400000 < now.getTime());
    await supabase.from("subscriptions").update({
      status: shouldBlock ? "blocked" : "overdue",
      blocked_at: shouldBlock ? now.toISOString() : existingSub.blocked_at || null,
    }).eq("id", existingSub.id);
  } else if ((event === "PAYMENT_REFUNDED" || event === "PAYMENT_DELETED") && existingSub) {
    await supabase.from("subscriptions").update({ status: "cancelled" }).eq("id", existingSub.id);
  }

  return json({ ok: true });
}

async function adminCreateBroker(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const auth = await requireSuperAdmin(req, supabaseUrl, anonKey);
  if (auth.error) return auth.error;
  const { callerId, supabaseAdmin } = auth;

  const { full_name, email, password, phone, account_type, plan_id } = await req.json();
  if (!full_name || !email || !password || password.length < 6) {
    return json({ error: "Nome, email e senha (mín. 6 caracteres) são obrigatórios" }, 400);
  }

  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, account_type: account_type || "corretor" },
  });
  if (createErr || !created.user) {
    const msg = (createErr?.message || "").toLowerCase();
    if (msg.includes("already")) return json({ error: "Este e-mail já possui uma conta no sistema." }, 409);
    return json({ error: createErr?.message || "Erro ao criar usuário" }, 400);
  }

  await supabaseAdmin
    .from("profiles")
    .update({
      full_name,
      phone: phone || null,
      account_type: account_type || "corretor",
      approval_status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: callerId,
    })
    .eq("user_id", created.user.id);

  if (plan_id) {
    const { error: subErr } = await supabaseAdmin.rpc("create_trial_subscription", {
      _user_id: created.user.id,
      _plan_id: plan_id,
    });
    if (subErr) return json({ success: true, user_id: created.user.id, warning: `Conta criada, mas plano não vinculado: ${subErr.message}` });
  }

  return json({ success: true, user_id: created.user.id });
}

async function adminCreateStaff(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const auth = await requireSuperAdmin(req, supabaseUrl, anonKey);
  if (auth.error) return auth.error;
  const { callerId, supabaseAdmin } = auth;

  const { full_name, email, password, function_title } = await req.json();
  if (!full_name || !email || !password || password.length < 6) {
    return json({ error: "Nome, email e senha (mín. 6 caracteres) são obrigatórios" }, 400);
  }

  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, account_type: "admin_staff" },
  });
  if (createErr || !created.user) {
    const msg = (createErr?.message || "").toLowerCase();
    if (msg.includes("already")) return json({ error: "Este e-mail já possui uma conta no sistema." }, 409);
    return json({ error: createErr?.message || "Erro ao criar usuário" }, 400);
  }

  await supabaseAdmin
    .from("profiles")
    .update({
      full_name,
      account_type: "admin_staff",
      approval_status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: callerId,
    })
    .eq("user_id", created.user.id);

  await supabaseAdmin.from("user_roles").delete().eq("user_id", created.user.id);
  await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: "admin_staff" });
  await supabaseAdmin.from("staff_permissions").insert({
    user_id: created.user.id,
    permissions: DEFAULT_STAFF_PERMISSIONS,
    function_title: function_title || null,
  });

  return json({ success: true, user_id: created.user.id });
}

async function resetPassword(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const callerId = await authedUserId(req, supabaseUrl, anonKey);
  if (!callerId) return json({ error: "Unauthorized" }, 401);

  const { target_user_id, new_password } = await req.json();
  if (!new_password || new_password.length < 6) return json({ error: "A senha deve ter pelo menos 6 caracteres" }, 400);

  const supabaseAdmin = createClient(supabaseUrl, getServiceKey());
  if (callerId !== target_user_id) {
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "super_admin")
      .maybeSingle();
    if (!roleData) return json({ error: "Sem permissão para alterar esta senha" }, 403);
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(target_user_id, { password: new_password });
  if (error) return json({ error: error.message }, 400);
  return json({ success: true });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const fn = getFunctionName(req);
    if (fn === "asaas-checkout") return await asaasCheckout(req);
    if (fn === "asaas-test") return await asaasTest(req);
    if (fn === "asaas-webhook") return await asaasWebhook(req);
    if (fn === "admin-create-broker") return await adminCreateBroker(req);
    if (fn === "admin-create-staff") return await adminCreateStaff(req);
    if (fn === "reset-password") return await resetPassword(req);
    if (fn === "cloudflare-direct-upload") return await cloudflareDirectUpload(req);
    if (fn === "cloudflare-stream-direct-upload") return await cloudflareStreamDirectUpload(req);
    if (fn === "property-feed") return await propertyFeed(req);
    if (fn === "generate-description") return await generateDescription(req);
    if (fn === "property-valuation") return await propertyValuation(req);
    if (fn === "generate-contract") return await generateContract(req);
    if (fn === "shark-ai") return await sharkAi(req);
    if (fn === "parse-imovel-ia") return await parseImovelIa(req);
    if (fn === "parse-tabela-pdf-ia") return await parseTabelaPdfIa(req);
    if (
      [
        "mercado-pago-checkout",
        "mercado-pago-webhook",
      ].includes(fn)
    ) {
      return json({ error: `Function ${fn} is not routed in the self-hosted edge runtime` }, 501);
    }
    return json({ message: "MV Broker Connect Edge Functions OK", function: fn });
  } catch (error) {
    console.error("Edge function router error:", error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
