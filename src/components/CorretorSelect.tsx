import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface CorretorOption {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  creci: string | null;
  ativo: boolean;
}

export function useCorretores() {
  const { user } = useAuth();
  const [corretores, setCorretores] = useState<CorretorOption[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) { setCorretores([]); setLoading(false); return; }
    const { data } = await (supabase as any)
      .from("corretores")
      .select("id, nome, email, telefone, creci, ativo")
      .eq("user_id", user.id)
      .order("nome");
    setCorretores((data as CorretorOption[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  return { corretores, loading, reload };
}

/** Seletor do corretor responsável pelo imóvel, com criação rápida. */
export function CorretorSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string, nome: string) => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { corretores, reload } = useCorretores();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", creci: "" });

  const handleCreate = async () => {
    if (!user) return;
    if (!form.nome.trim()) {
      toast({ title: "Informe o nome", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data, error } = await (supabase as any)
      .from("corretores")
      .insert([{ user_id: user.id, nome: form.nome.trim(), email: form.email || null, telefone: form.telefone || null, creci: form.creci || null }])
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao cadastrar corretor", description: error.message, variant: "destructive" });
      return;
    }
    await reload();
    onChange(data.id, data.nome);
    setForm({ nome: "", email: "", telefone: "", creci: "" });
    setOpen(false);
    toast({ title: "Corretor cadastrado ✅", description: data.nome });
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs flex items-center gap-1">
        <UserCircle className="w-3.5 h-3.5" /> Corretor responsável
      </Label>
      <div className="flex items-center gap-2">
        <Select
          value={value || "none"}
          onValueChange={(v) => {
            if (v === "none") return onChange("", "");
            const c = corretores.find((x) => x.id === v);
            onChange(v, c?.nome || "");
          }}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecione o corretor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem corretor definido</SelectItem>
            {corretores.filter((c) => c.ativo).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}{c.creci ? ` · CRECI ${c.creci}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="button"
          title="Novo corretor"
          onClick={() => setOpen(true)}
          className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo corretor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} placeholder="João da Silva" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Telefone</Label>
                <Input value={form.telefone} onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))} placeholder="(51) 99999-0000" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">CRECI</Label>
                <Input value={form.creci} onChange={(e) => setForm((p) => ({ ...p, creci: e.target.value }))} placeholder="123456-RS" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">E-mail</Label>
              <Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="corretor@email.com" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" onClick={handleCreate} disabled={saving} className="flex-1">
                {saving ? "Salvando..." : "Cadastrar corretor"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
