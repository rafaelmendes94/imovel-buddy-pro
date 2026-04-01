import { SmartLayout } from "@/components/SmartLayout";
import { BackButton } from "@/components/BackButton";
import { Building2, CreditCard, Bell, Shield, KeyRound, Palette, BrainCircuit, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SiteConfigDialog } from "@/components/SiteConfigDialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";

const AI_MODELS = [
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Rápido)" },
  { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite (Econômico)" },
  { value: "gemini-2.5-pro-preview-05-06", label: "Gemini 2.5 Pro (Avançado)" },
  { value: "gemini-2.5-flash-preview-05-20", label: "Gemini 2.5 Flash (Balanceado)" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
];

export default function Settings() {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showSiteConfig, setShowSiteConfig] = useState(false);
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changing, setChanging] = useState(false);
  const { toast } = useToast();
  const { isSuperAdmin } = useAuth();

  // AI config state
  const [apiKey, setApiKey] = useState("");
  const [aiModel, setAiModel] = useState("gemini-2.0-flash");
  const [showKey, setShowKey] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [savingAI, setSavingAI] = useState(false);

  useEffect(() => {
    if (showAIConfig) loadAIConfig();
  }, [showAIConfig]);

  const loadAIConfig = async () => {
    setLoadingAI(true);
    const { data } = await supabase
      .from("system_settings" as any)
      .select("key, value")
      .in("key", ["gemini_api_key", "ai_model"]);
    if (data) {
      for (const row of data as any[]) {
        if (row.key === "gemini_api_key") setApiKey(row.value || "");
        if (row.key === "ai_model") setAiModel(row.value || "gemini-2.0-flash");
      }
    }
    setLoadingAI(false);
  };

  const handleSaveAIConfig = async () => {
    setSavingAI(true);
    const updates = [
      { key: "gemini_api_key", value: apiKey },
      { key: "ai_model", value: aiModel },
    ];
    for (const u of updates) {
      await (supabase.from("system_settings" as any) as any)
        .update({ value: u.value, updated_at: new Date().toISOString() })
        .eq("key", u.key);
    }
    toast({ title: "Configuração de IA salva com sucesso!" });
    setSavingAI(false);
    setShowAIConfig(false);
  };

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
    ...(isSuperAdmin
      ? [
          {
            icon: BrainCircuit,
            title: "Configuração de IA",
            description: "API Key do Gemini e modelo de inteligência artificial",
            onClick: () => setShowAIConfig(true),
          },
        ]
      : []),
  ];

  return (
    <SmartLayout>
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
              <Input type="password" placeholder="Nova senha (mín. 6 caracteres)" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <Input type="password" placeholder="Confirmar nova senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              <Button onClick={handleChangePassword} disabled={changing} className="w-full">
                {changing ? "Alterando..." : "Alterar Senha"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* AI Config Dialog */}
        <Dialog open={showAIConfig} onOpenChange={setShowAIConfig}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-accent" />
                Configuração de IA
              </DialogTitle>
            </DialogHeader>
            {loadingAI ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">API Key do Google Gemini</Label>
                  <div className="relative">
                    <Input
                      type={showKey ? "text" : "password"}
                      placeholder="AIzaSy..."
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      className="pr-10 h-10 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Obtenha em{" "}
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-accent underline">
                      aistudio.google.com/apikey
                    </a>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Modelo de IA</Label>
                  <Select value={aiModel} onValueChange={setAiModel}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    Este modelo será usado em todas as funcionalidades de IA do sistema
                  </p>
                </div>

                <Button onClick={handleSaveAIConfig} disabled={savingAI} className="w-full">
                  {savingAI ? "Salvando..." : "Salvar Configuração"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <SiteConfigDialog open={showSiteConfig} onOpenChange={setShowSiteConfig} configType="main_site" title="Aparência do Site Público" />
      </div>
    </SmartLayout>
  );
}
