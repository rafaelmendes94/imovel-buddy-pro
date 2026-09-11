import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CepAutoFill, type AddressData } from "@/components/CepAutoFill";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Building2 } from "lucide-react";
import {
  TIPO_OPTIONS,
  saveEmpreendimento,
  getEmpreendimentoById,
  type EmpreendimentoRecord,
  type EmpreendimentoTipo,
} from "@/lib/empreendimentos";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Preenche o nome ao abrir (ex.: termo digitado na busca). */
  defaultNome?: string;
  defaultTipo?: EmpreendimentoTipo;
  /** Quando informado, o formulário edita o registro existente. */
  editing?: { tipo: EmpreendimentoTipo; id: string } | null;
  onSaved: (record: EmpreendimentoRecord) => void;
}

const emptyForm = {
  nome: "",
  construtora: "",
  ano_construcao: "",
  status: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  latitude: "",
  longitude: "",
  total_unidades: "",
  descricao: "",
};

export function EmpreendimentoFormDialog({
  open,
  onOpenChange,
  defaultNome = "",
  defaultTipo = "edificio",
  editing = null,
  onSaved,
}: Props) {
  const { toast } = useToast();
  const [tipo, setTipo] = useState<EmpreendimentoTipo>(defaultTipo);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setLoading(true);
      setTipo(editing.tipo);
      getEmpreendimentoById(editing.tipo, editing.id).then((rec) => {
        if (rec) {
          setForm({
            nome: rec.nome || "",
            construtora: rec.construtora || "",
            ano_construcao: rec.ano_construcao || "",
            status: rec.status || "",
            cep: rec.cep || "",
            endereco: rec.endereco || "",
            numero: rec.numero || "",
            complemento: rec.complemento || "",
            bairro: rec.bairro || "",
            cidade: rec.cidade || "",
            estado: rec.estado || "",
            latitude: rec.latitude != null ? String(rec.latitude) : "",
            longitude: rec.longitude != null ? String(rec.longitude) : "",
            total_unidades: rec.total_unidades != null ? String(rec.total_unidades) : "",
            descricao: rec.descricao || "",
          });
        }
        setLoading(false);
      });
    } else {
      setTipo(defaultTipo);
      setForm({ ...emptyForm, nome: defaultNome });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (k: keyof typeof emptyForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const addressData: AddressData = {
    cep: form.cep,
    endereco: form.endereco,
    numero: form.numero,
    complemento: form.complemento,
    bairro: form.bairro,
    cidade: form.cidade,
    estado: form.estado,
    latitude: form.latitude,
    longitude: form.longitude,
  };

  const submit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const record = await saveEmpreendimento(
        tipo,
        {
          ...form,
          total_unidades: form.total_unidades ? Number(form.total_unidades) : null,
        },
        editing?.id
      );
      toast({
        title: editing ? "Empreendimento atualizado ✅" : "Empreendimento cadastrado ✅",
        description: record.nome,
      });
      onSaved(record);
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            {editing ? "Editar empreendimento" : "Novo empreendimento"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo do empreendimento *</Label>
              <div className="flex flex-wrap gap-2">
                {TIPO_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={!!editing}
                    onClick={() => setTipo(opt.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-60 ${
                      tipo === opt.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-secondary-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {editing && (
                <p className="text-[11px] text-muted-foreground">
                  O tipo não pode ser alterado para não mover registros entre cadastros.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs">Nome *</Label>
                <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Nome do empreendimento" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Construtora</Label>
                <Input value={form.construtora} onChange={(e) => set("construtora", e.target.value)} />
              </div>
              {tipo === "loteamento" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs">Situação</Label>
                  <Input value={form.status} onChange={(e) => set("status", e.target.value)} placeholder="Em vendas" />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs">Ano de construção</Label>
                  <Input value={form.ano_construcao} onChange={(e) => set("ano_construcao", e.target.value)} placeholder="Ex: 2024" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs">Total de unidades</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.total_unidades}
                  onChange={(e) => set("total_unidades", e.target.value)}
                />
              </div>
            </div>

            <CepAutoFill data={addressData} onChange={(updates) => setForm((f) => ({ ...f, ...updates }))} />

            <div className="space-y-1.5">
              <Label className="text-xs">Descrição</Label>
              <Textarea value={form.descricao} onChange={(e) => set("descricao", e.target.value)} rows={3} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving || loading} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar empreendimento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
