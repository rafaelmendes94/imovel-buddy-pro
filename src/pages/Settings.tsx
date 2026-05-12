import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { Building2, CreditCard, Bell, Shield, KeyRound, Palette, Eye, EyeOff, Globe, Copy, Loader2, CheckCircle, XCircle, User, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SiteConfigDialog } from "@/components/SiteConfigDialog";
import { useAuth } from "@/hooks/useAuth";

export default function Settings() {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showSiteConfig, setShowSiteConfig] = useState(false);
  const [showAsaasDialog, setShowAsaasDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changing, setChanging] = useState(false);
  const { toast } = useToast();
  const { isSuperAdmin } = useAuth();

  // Asaas state
  const [asaasKey, setAsaasKey] = useState("");
  const [asaasEnv, setAsaasEnv] = useState("sandbox");
  const [showKey, setShowKey] = useState(false);
  const [savingAsaas, setSavingAsaas] = useState(false);
  const [testingAsaas, setTestingAsaas] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  // Profile state
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (showAsaasDialog) loadAsaasSettings();
  }, [showAsaasDialog]);

  useEffect(() => {
    if (showProfileDialog) loadProfile();
  }, [showProfileDialog]);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("full_name, phone, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setProfileName(data.full_name || "");
      setProfilePhone(data.phone || "");
      setProfileAvatar(data.avatar_url || "");
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingProfile(false); return; }
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: profileName, phone: profilePhone, avatar_url: profileAvatar })
      .eq("user_id", user.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado!", description: "WhatsApp e foto serão usados na sua página pública." });
      setShowProfileDialog(false);
    }
    setSavingProfile(false);
  };

  const handleAvatarUpload = async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
    if (upErr) { toast({ title: "Erro no upload", description: upErr.message, variant: "destructive" }); return; }
    const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
    setProfileAvatar(pub.publicUrl);
  };

  const loadAsaasSettings = async () => {
    const { data } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["asaas_api_key", "asaas_environment"]);
    if (data) {
      data.forEach((s) => {
        if (s.key === "asaas_api_key") setAsaasKey(s.value);
        if (s.key === "asaas_environment") setAsaasEnv(s.value);
      });
    }
  };

  const saveAsaasSetting = async (key: string, value: string) => {
    const { data: existing } = await supabase
      .from("system_settings")
      .select("id")
      .eq("key", key)
      .maybeSingle();
    if (existing) {
      await supabase.from("system_settings").update({ value }).eq("id", existing.id);
    } else {
      await supabase.from("system_settings").insert({ key, value });
    }
  };

  const handleSaveAsaas = async () => {
    setSavingAsaas(true);
    try {
      await saveAsaasSetting("asaas_api_key", asaasKey);
      await saveAsaasSetting("asaas_environment", asaasEnv);
      toast({ title: "Salvo!", description: "Credenciais do Asaas atualizadas." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setSavingAsaas(false);
  };

  const handleTestAsaas = async () => {
    setTestingAsaas(true);
    setTestResult(null);
    try {
      const { data } = await supabase.functions.invoke("asaas-checkout", {
        body: { plan_id: "test", user_id: "test" },
      });
      if (data?.error?.includes("não configurado")) {
        setTestResult("error");
      } else {
        setTestResult("success");
        toast({ title: "Conexão OK!", description: "API Key do Asaas válida." });
      }
    } catch {
      setTestResult("error");
    }
    setTestingAsaas(false);
  };

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/asaas-webhook`;

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    setChanging(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      setChanging(false);
      return;
    }
    const res = await supabase.functions.invoke("reset-password", {
      body: { target_user_id: user.id, new_password: newPassword },
    });
    if (res.error || res.data?.error) {
      toast({ title: "Erro", description: res.data?.error || res.error?.message, variant: "destructive" });
    } else {
      toast({ title: "Senha alterada com sucesso!" });
      setShowPasswordDialog(false);
      setNewPassword("");
      setConfirmPassword("");
    }
    setChanging(false);
  };

  const cards = [
    {
      icon: User,
      title: "Meu Perfil",
      description: "Nome, foto e WhatsApp que aparecem nos imóveis e na sua página pública",
      onClick: () => setShowProfileDialog(true),
    },
    {
      icon: Building2,
      title: "Dados da Imobiliária",
      description: "Nome, CNPJ, endereço e informações de contato",
      onClick: undefined,
    },
    {
      icon: CreditCard,
      title: "Plano e Assinatura",
      description: "Gerencie seu plano, pagamentos e faturamento",
      onClick: undefined,
    },
    {
      icon: Bell,
      title: "Notificações",
      description: "Alertas de novos leads, vendas e atividades",
      onClick: undefined,
    },
    {
      icon: KeyRound,
      title: "Alterar Senha",
      description: "Troque sua senha de acesso ao sistema",
      onClick: () => setShowPasswordDialog(true),
    },
    {
      icon: Shield,
      title: "Segurança",
      description: "Autenticação e permissões de acesso",
      onClick: undefined,
    },
    {
      icon: Palette,
      title: "Aparência do Site",
      description: "Cores do cabeçalho, rodapé e foto de capa do site público",
      onClick: () => setShowSiteConfig(true),
    },
    ...(isSuperAdmin ? [{
      icon: CreditCard,
      title: "Asaas / Pagamentos",
      description: "Configure a API Key e ambiente do gateway Asaas",
      onClick: () => setShowAsaasDialog(true),
    }] : []),
  ];

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie sua conta e assinatura
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map((item) => (
            <button
              key={item.title}
              onClick={item.onClick}
              className="elevated-card rounded-xl p-5 text-left hover:border-accent/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground text-sm">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Password Dialog */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Alterar Minha Senha</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input
                type="password"
                placeholder="Nova senha (mín. 6 caracteres)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Confirmar nova senha"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
              <Button onClick={handleChangePassword} disabled={changing} className="w-full">
                {changing ? "Alterando..." : "Alterar Senha"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Asaas Config Dialog */}
        <Dialog open={showAsaasDialog} onOpenChange={setShowAsaasDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Asaas — Pagamentos
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="relative">
                  <Input
                    type={showKey ? "text" : "password"}
                    value={asaasKey}
                    onChange={(e) => setAsaasKey(e.target.value)}
                    placeholder="$aact_xxxxxxxxxx..."
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ambiente</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={asaasEnv === "sandbox" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAsaasEnv("sandbox")}
                  >
                    <Globe className="w-4 h-4 mr-1" />
                    Sandbox
                  </Button>
                  <Button
                    type="button"
                    variant={asaasEnv === "production" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAsaasEnv("production")}
                  >
                    <Globe className="w-4 h-4 mr-1" />
                    Produção
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {asaasEnv === "sandbox" ? "Pagamentos simulados, sem cobrança real." : "Cobranças reais serão processadas."}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono break-all">
                    {webhookUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(webhookUrl);
                      toast({ title: "URL copiada!" });
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Cole no painel do Asaas → Integrações → Webhooks.</p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveAsaas} disabled={savingAsaas}>
                  {savingAsaas ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Salvar
                </Button>
                <Button variant="outline" onClick={handleTestAsaas} disabled={testingAsaas || !asaasKey}>
                  {testingAsaas ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : testResult === "success" ? (
                    <CheckCircle className="w-4 h-4 mr-2 text-success" />
                  ) : testResult === "error" ? (
                    <XCircle className="w-4 h-4 mr-2 text-destructive" />
                  ) : null}
                  Testar Conexão
                </Button>
              </div>

              {testResult && (
                <Badge variant={testResult === "success" ? "default" : "destructive"}>
                  {testResult === "success" ? "✓ Conexão OK" : "✗ Falha na conexão"}
                </Badge>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Profile Dialog */}
        <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5" /> Meu Perfil
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {profileAvatar ? (
                  <img src={profileAvatar} alt="Avatar" className="w-16 h-16 rounded-full object-cover border border-border" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-7 h-7 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <Label className="text-xs">Foto de perfil</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
                    className="text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Seu nome" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> WhatsApp</Label>
                <Input
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="Ex: 5551999999999 (com DDI + DDD)"
                />
                <p className="text-xs text-muted-foreground">
                  Esse número será usado no botão WhatsApp dos seus imóveis e na sua página pública.
                </p>
              </div>
              <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-full">
                {savingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <SiteConfigDialog
          open={showSiteConfig}
          onOpenChange={setShowSiteConfig}
          configType="main_site"
          title="Aparência do Site Público"
        />
      </div>
    </AppLayout>
  );
}
