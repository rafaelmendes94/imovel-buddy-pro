import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const DEFAULT_PERMISSIONS = {
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseUser = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const callerId = claimsData.claims.sub as string;
    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "super_admin")
      .maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Apenas super admin pode cadastrar funcionários" }), { status: 403, headers: corsHeaders });
    }

    const { full_name, email, password, function_title } = await req.json();
    if (!full_name || !email || !password || password.length < 6) {
      return new Response(JSON.stringify({ error: "Nome, email e senha (mín. 6 caracteres) são obrigatórios" }), { status: 400, headers: corsHeaders });
    }

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, account_type: "admin_staff" },
    });

    if (createErr || !created.user) {
      const msg = (createErr?.message || "").toLowerCase();
      if (msg.includes("already")) {
        return new Response(JSON.stringify({ error: "Este e-mail já possui uma conta no sistema." }), { status: 409, headers: corsHeaders });
      }
      return new Response(JSON.stringify({ error: createErr?.message || "Erro ao criar usuário" }), { status: 400, headers: corsHeaders });
    }

    const newUserId = created.user.id;
    await supabaseAdmin
      .from("profiles")
      .update({
        full_name,
        account_type: "admin_staff",
        approval_status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: callerId,
      })
      .eq("user_id", newUserId);

    await supabaseAdmin.from("user_roles").delete().eq("user_id", newUserId);
    await supabaseAdmin.from("user_roles").insert({ user_id: newUserId, role: "admin_staff" });
    await supabaseAdmin.from("staff_permissions").insert({
      user_id: newUserId,
      permissions: DEFAULT_PERMISSIONS,
      function_title: function_title || null,
    });

    return new Response(JSON.stringify({ success: true, user_id: newUserId }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: corsHeaders });
  }
});
