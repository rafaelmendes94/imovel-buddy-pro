import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const callerId = claimsData.claims.sub as string;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: roleData } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", callerId).eq("role", "super_admin").maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Apenas super admin pode cadastrar corretores" }), { status: 403, headers: corsHeaders });
    }

    const { full_name, email, password, phone, account_type, plan_id } = await req.json();

    if (!full_name || !email || !password || password.length < 6) {
      return new Response(JSON.stringify({ error: "Nome, email e senha (mín. 6 caracteres) são obrigatórios" }), { status: 400, headers: corsHeaders });
    }

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, account_type: account_type || "corretor" },
    });

    if (createErr || !created.user) {
      return new Response(JSON.stringify({ error: createErr?.message || "Erro ao criar usuário" }), { status: 400, headers: corsHeaders });
    }

    const newUserId = created.user.id;

    // Update profile (handle_new_user trigger creates it; we just patch phone)
    if (phone) {
      await supabaseAdmin.from("profiles").update({ phone, full_name }).eq("user_id", newUserId);
    } else {
      await supabaseAdmin.from("profiles").update({ full_name }).eq("user_id", newUserId);
    }

    // Create trial subscription with chosen plan
    if (plan_id) {
      const { error: subErr } = await supabaseAdmin.rpc("create_trial_subscription", {
        _user_id: newUserId,
        _plan_id: plan_id,
      });
      if (subErr) {
        return new Response(JSON.stringify({ success: true, user_id: newUserId, warning: `Conta criada, mas plano não vinculado: ${subErr.message}` }), { headers: corsHeaders });
      }
    }

    return new Response(JSON.stringify({ success: true, user_id: newUserId }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: corsHeaders });
  }
});
