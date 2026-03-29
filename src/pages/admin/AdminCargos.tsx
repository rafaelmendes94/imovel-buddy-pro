import { AdminLayout } from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save, X, Briefcase } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const DEFAULT_TITLES = [
  "Gerente Administrativo",
  "Coordenador de Vendas",
  "Analista Financeiro",
  "Assistente Administrativo",
  "Gerente Comercial",
  "Suporte Técnico",
  "Marketing",
];

export default function AdminCargos() {
  const [cargos, setCargos] = useState<string[]>([]);
  const [newCargo, setNewCargo] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem("admin_cargos");
    if (saved) {
      setCargos(JSON.parse(saved));
    } else {
      setCargos(DEFAULT_TITLES);
      localStorage.setItem("admin_cargos", JSON.stringify(DEFAULT_TITLES));
    }
  }, []);

  const persist = (list: string[]) => {
    setCargos(list);
    localStorage.setItem("admin_cargos", JSON.stringify(list));
  };

  const handleAdd = () => {
    const trimmed = newCargo.trim();
    if (!trimmed) return;
    if (cargos.includes(trimmed)) {
      toast({ title: "Cargo já existe", variant: "destructive" });
      return;
    }
    persist([...cargos, trimmed]);
    setNewCargo("");
    setDialogOpen(false);
    toast({ title: "Cargo adicionado!" });
  };

  const handleSaveEdit = (index: number) => {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    if (cargos.some((c, i) => i !== index && c === trimmed)) {
      toast({ title: "Cargo já existe", variant: "destructive" });
      return;
    }
    const updated = [...cargos];
    updated[index] = trimmed;
    persist(updated);
    setEditingIndex(null);
    toast({ title: "Cargo atualizado!" });
  };

  const handleDelete = (index: number) => {
    const updated = cargos.filter((_, i) => i !== index);
    persist(updated);
    toast({ title: "Cargo removido" });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Cargos e Funções</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Novo Cargo</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Adicionar Cargo</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input
                  placeholder="Nome do cargo ou função"
                  value={newCargo}
                  onChange={e => setNewCargo(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAdd()}
                />
                <Button onClick={handleAdd} className="w-full">Adicionar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {cargos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">Nenhum cargo cadastrado</p>
            <p className="text-sm">Clique em "Novo Cargo" para adicionar.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cargos.map((cargo, index) => {
              const isEditing = editingIndex === index;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between bg-card border border-border rounded-xl px-5 py-4 hover:bg-muted/20 transition-colors"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 mr-3">
                      <Input
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSaveEdit(index)}
                        className="flex-1"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleSaveEdit(index)}>
                        <Save className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingIndex(null)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{cargo}</span>
                        {DEFAULT_TITLES.includes(cargo) && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">Padrão</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditingIndex(index); setEditValue(cargo); }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
