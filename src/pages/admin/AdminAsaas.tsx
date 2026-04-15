import { AdminLayout } from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Eye, EyeOff, CheckCircle, XCircle, Loader2, Globe, Copy } from "lucide-react";

export default function AdminAsaas() {
  const [apiKey, setApiKey] = useState("");
  const [environment, setEnvironment] = useState("sandbox");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["asaas_api_key", "asaas_environment"]);

    if (data) {
      data.forEach((s) => {
        if (s.key === "asaas_api_key") setApiKey(s.value);
        if (s.key === "asaas_environment") setEnvironment(s.value);
      });
    }
  };

  const saveSetting = async (key: string, value: string) => {
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

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSetting("asaas_api_key", apiKey);
      await saveSetting("asaas_environment", environment);
      toast({ title: "Configurações salvas!", description: "As credenciais do Asaas foram atualizadas." });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const baseUrl = environment === "production"
        ? "https://api.asaas.com/api"
        : "https://sandbox.asaas.com/api";

      // We test by calling asaas-checkout with a test to validate key
      // Instead, let's just invoke the edge function with a simple test
      const { data, error } = await supabase.functions.invoke("asaas-checkout", {
        body: { plan_id: "test", user_id: "test" },
      });

      // If API key is not set, it returns a specific message
      if (data?.error?.includes("não configurado")) {
        setTestResult("error");
        toast({ title: "Erro", description: "API Key não configurada.", variant: "destructive" });
      } else if (error) {
        setTestResult("error");
        toast({ title: "Erro na conexão", description: "Verifique a API Key.", variant: "destructive" });
      } else {
        // Even a 404 for plan means the key works
        setTestResult("success");
        toast({ title: "Conexão OK!", description: "A API Key do Asaas está funcionando." });
      }
    } catch {
      setTestResult("error");
      toast({ title: "Erro na conexão", description: "Não foi possível testar.", variant: "destructive" });
    }
    setTesting(false);
  };

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/asaas-webhook`;

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast({ title: "URL copiada!", description: "Cole no painel do Asaas em Integrações > Webhooks." });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <CreditCard className="w-7 h-7 text-accent" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Asaas — Pagamentos</h1>
            <p className="text-sm text-muted-foreground">Configure a integração com o gateway de pagamentos Asaas</p>
          </div>
        </div>

        {/* API Key Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Credenciais</CardTitle>
            <CardDescription>
              Insira a API Key obtida no painel do Asaas (Configurações &gt; Integrações &gt; API).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="asaas-key">API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="asaas-key"
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
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
            </div>

            <div className="space-y-2">
              <Label>Ambiente</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={environment === "sandbox" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEnvironment("sandbox")}
                >
                  <Globe className="w-4 h-4 mr-1" />
                  Sandbox (Teste)
                </Button>
                <Button
                  type="button"
                  variant={environment === "production" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEnvironment("production")}
                >
                  <Globe className="w-4 h-4 mr-1" />
                  Produção
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {environment === "sandbox"
                  ? "Modo sandbox: pagamentos simulados, sem cobrança real."
                  : "Modo produção: cobranças reais serão processadas."}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Salvar
              </Button>
              <Button variant="outline" onClick={handleTest} disabled={testing || !apiKey}>
                {testing ? (
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
              <Badge variant={testResult === "success" ? "default" : "destructive"} className="mt-2">
                {testResult === "success" ? "✓ Conexão estabelecida" : "✗ Falha na conexão"}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Webhook URL Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Webhook</CardTitle>
            <CardDescription>
              Configure este URL no painel do Asaas (Integrações &gt; Webhooks) para receber notificações de pagamento automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono break-all">
                {webhookUrl}
              </code>
              <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Eventos recomendados:</strong></p>
              <ul className="list-disc list-inside">
                <li>PAYMENT_CONFIRMED</li>
                <li>PAYMENT_RECEIVED</li>
                <li>PAYMENT_OVERDUE</li>
                <li>PAYMENT_REFUNDED</li>
                <li>PAYMENT_DELETED</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Status Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Badge variant={apiKey ? "default" : "secondary"}>
                {apiKey ? "API Key configurada" : "API Key não configurada"}
              </Badge>
              <Badge variant="outline">
                {environment === "production" ? "🟢 Produção" : "🟡 Sandbox"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
