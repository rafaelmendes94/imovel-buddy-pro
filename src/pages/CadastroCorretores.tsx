import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Trash2, Edit, Phone, Mail, Award, Building2, Loader2 } from "lucide-react";

interface Corretor {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  creci: string | null;
  ativo: boolean;
}

const emptyForm = { nome: "", email: "", telefone: "", creci: "", ativo: true };

export default function CadastroCorretores() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [corretores, setCorretores] = useState<Corretor[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    if (!user) return;
    const [{ data }, { data: imoveis }] = await Promise.all([
      (supabase as any).from("corretores").select("id, nome, email, telefone, creci, ativo").eq("user_id", user.id).order("nome"),
      (supabase as any).from("imoveis").select("corretor_cadastro_id").eq("user_id", user.id),
    ]);
    setCorretores((data as Corretor[]) || []);
    const map: Record<string, number> = {};
    ((imoveis as any[]) || []).forEach((i) => {
      if (i.corretor_cadastro_id) map[i.corretor_cadastro_id] = (map[i.corretor_cadastro_id] || 0) + 1;
    });
    setCounts(map);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const handleSave = async () => {
    if (!user) return;
    if (!form.nome.trim()) {
      toast({ title: "Informe o nome do corretor", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      nome: form.nome.trim(),
      email: form.email || null,
      telefone: form.telefone || null,
      creci: form.creci || null,
      ativo: form.ativo,
    };
    const { error } = editingId
      ? await (supabase as any).from("corretores").update(payload).eq("id", editingId)
      : await (supabase as any).from("corretores").insert([{ ...payload, user_id: user.id }]);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editingId ? "Corretor atualizado ✅" : "Corretor cadastrado ✅" });
    setForm(emptyForm);
    setEditingId(null);
    load();
  };

  const handleDelete = async (c: Corretor) => {
    const { error } = await (supabase as any).from("corretores").delete().eq("id", c.id);
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Corretor removido" });
    load();
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <BackButton fallback="/imoveis" />

        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Cadastro de Corretores
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastre sua equipe e vincule cada imóvel a um corretor responsável. O nome aparece no CRM e no site.
          </p>
        </header>

        {/* Formulário */}
        <section className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
          <h2 className="text-base font-bold text-foreground">
            {editingId ? "Editar corretor" : "Novo corretor"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} placeholder="João da Silva" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Telefone / WhatsApp</Label>
              <Input value={form.telefone} onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))} placeholder="(51) 99999-0000" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CRECI</Label>
              <Input value={form.creci} onChange={(e) => setForm((p) => ({ ...p, creci: e.target.value }))} placeholder="123456-RS" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">E-mail</Label>
              <Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="corretor@email.com" />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Switch checked={form.ativo} onCheckedChange={(v) => setForm((p) => ({ ...p, ativo: v }))} />
              <span className="text-sm text-muted-foreground">Corretor ativo (disponível para vincular imóveis)</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {editingId ? "Salvar alterações" : "Cadastrar corretor"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancelar</Button>
            )}
          </div>
        </section>

        {/* Lista */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" /> Equipe ({corretores.length})
          </h2>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
            </div>
          )}

          {!loading && corretores.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-xl">
              Nenhum corretor cadastrado ainda.
            </p>
          )}

          {corretores.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                {c.nome.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground truncate">{c.nome}</p>
                  <Badge variant="outline" className="text-[10px]">{counts[c.id] || 0} imóveis</Badge>
                  {!c.ativo && <Badge variant="secondary" className="text-[10px]">Inativo</Badge>}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                  {c.creci && <span className="flex items-center gap-1"><Award className="w-3 h-3" />{c.creci}</span>}
                  {c.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.telefone}</span>}
                  {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setEditingId(c.id);
                    setForm({ nome: c.nome, email: c.email || "", telefone: c.telefone || "", creci: c.creci || "", ativo: c.ativo });
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </AppLayout>
  );
}
