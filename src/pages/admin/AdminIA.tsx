import { AdminLayout } from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Brain, Save, Loader2, Eye, EyeOff, Zap, CheckCircle2, AlertCircle } from "lucide-react";

const AI_MODELS = [
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash (Rápido)", desc: "Equilibrado — rápido e eficiente" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", desc: "Boa qualidade, baixo custo" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro (Premium)", desc: "Máxima qualidade, mais lento" },
  { id: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", desc: "Ultra rápido, tarefas simples" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini", desc: "Forte raciocínio, custo moderado" },
  { id: "openai/gpt-5", label: "GPT-5 (Premium)", desc: "Máximo desempenho OpenAI" },
];

export default function AdminIA() {
  const [model, setModel] = useState("google/gemini-3-flash-preview");
  const [externalKey, setExternalKey] = useState("");
  const [useExternal, setUseExternal] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from("system_settings").select("*").in("key", ["ai_model", "ai_external_key", "ai_use_external"]);
    if (data) {
      data.forEach(row => {
        if (row.key === "ai_model") setModel(row.value);
        if (row.key === "ai_external_key") setExternalKey(row.value);
        if (row.key === "ai_use_external") setUseExternal(row.value === "true");
      });
    }
    setLoading(false);
  };

  const saveSetting = async (key: string, value: string) => {
    const { data: existing } = await supabase.from("system_settings").select("id").eq("key", key).maybeSingle();
    if (existing) {
      await supabase.from("system_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", key);
    } else {
      await supabase.from("system_settings").insert({ key, value });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await Promise.all([
      saveSetting("ai_model", model),
      saveSetting("ai_external_key", externalKey),
      saveSetting("ai_use_external", String(useExternal)),
    ]);
    toast({ title: "Configurações de IA salvas ✅" });
    setSaving(false);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-description", {
        body: {
          property: {
            title: "Teste IA",
            type: "Apartamento",
            status: "disponível",
            price: 500000,
            address: "Rua Teste, 100",
            city: "Capão da Canoa",
            area: 60,
            bedrooms: 2,
            bathrooms: 1,
            parking: 1,
          },
          style: "informativa",
        },
      });
      if (error || data?.error) {
        setTestResult("error");
        toast({ title: "Erro no teste", description: data?.error || error?.message, variant: "destructive" });
      } else {
        setTestResult("success");
        toast({ title: "IA funcionando ✅", description: "Resposta gerada com sucesso!" });
      }
    } catch {
      setTestResult("error");
      toast({ title: "Erro de conexão", variant: "destructive" });
    }
    setTesting(false);
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="w-6 h-6" /> Configuração de IA
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure o modelo de inteligência artificial usado nas funções do sistema
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status */}
            <div className="elevated-card rounded-xl p-5 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-card-foreground">Status</h2>
                <Badge variant="secondary" className="bg-success/10 text-success text-[10px]">
                  Lovable AI Ativo
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                O sistema utiliza Lovable AI integrado com acesso a modelos Gemini e GPT sem necessidade de API key externa.
                Você pode opcionalmente configurar uma chave própria do Google Gemini para controle de custos e limites independentes.
              </p>
            </div>

            {/* Model Selection */}
            <div className="elevated-card rounded-xl p-5 border border-border">
              <h2 className="font-semibold text-card-foreground mb-4">Modelo de IA</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AI_MODELS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      model === m.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/30 hover:bg-muted/30"
                    }`}
                  >
                    <span className="text-sm font-medium text-card-foreground">{m.label}</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* External Key (Optional) */}
            <div className="elevated-card rounded-xl p-5 border border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-card-foreground">API Key Externa (Opcional)</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Use sua própria chave do Google Gemini para limites e custos independentes
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Usar externa</Label>
                  <Switch checked={useExternal} onCheckedChange={setUseExternal} />
                </div>
              </div>
              {useExternal && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Google Gemini API Key</Label>
                  <div className="relative">
                    <Input
                      type={showKey ? "text" : "password"}
                      value={externalKey}
                      onChange={e => setExternalKey(e.target.value)}
                      placeholder="AIzaSy..."
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
                  <p className="text-[10px] text-muted-foreground">
                    Obtenha em: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" className="text-primary underline">Google AI Studio</a>
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Configurações
              </Button>
              <Button variant="outline" onClick={handleTest} disabled={testing} className="gap-2">
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Testar IA
              </Button>
              {testResult === "success" && <CheckCircle2 className="w-5 h-5 text-success" />}
              {testResult === "error" && <AlertCircle className="w-5 h-5 text-destructive" />}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
