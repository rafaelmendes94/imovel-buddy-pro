import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { Building2, CreditCard, Bell, Shield, KeyRound, Palette } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SiteConfigDialog } from "@/components/SiteConfigDialog";

export default function Settings() {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showSiteConfig, setShowSiteConfig] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changing, setChanging] = useState(false);
  const { toast } = useToast();

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
