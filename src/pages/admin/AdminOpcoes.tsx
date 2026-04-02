import { AdminLayout } from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical, Save, Settings2, ChevronDown, ChevronRight } from "lucide-react";

interface SystemOption {
  id: string;
  category: string;
  value: string;
  sort_order: number;
}

const CATEGORIES = [
  { key: "infraestrutura", label: "Infraestrutura (Edifícios/Empreendimentos)", color: "bg-blue-500/10 text-blue-500" },
  { key: "amenidades_condominio", label: "Amenidades (Condomínios)", color: "bg-green-500/10 text-green-500" },
  { key: "tipo_imovel", label: "Tipo de Imóvel", color: "bg-purple-500/10 text-purple-500" },
  { key: "status_imovel", label: "Status do Imóvel", color: "bg-amber-500/10 text-amber-500" },
  { key: "condicao_imovel", label: "Condição do Imóvel", color: "bg-orange-500/10 text-orange-500" },
  { key: "padrao_imovel", label: "Padrão do Imóvel", color: "bg-rose-500/10 text-rose-500" },
  { key: "categoria_brick", label: "Categorias do Brick", color: "bg-teal-500/10 text-teal-500" },
];

export default function AdminOpcoes() {
  const [options, setOptions] = useState<SystemOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ infraestrutura: true });
  const { toast } = useToast();

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const { data } = await supabase.from("system_options").select("*").order("sort_order");
    if (data) setOptions(data);
    setLoading(false);
  };

  const getByCategory = (cat: string) => options.filter(o => o.category === cat);

  const addOption = async (category: string) => {
    const val = (newValues[category] || "").trim();
    if (!val) return;
    const existing = getByCategory(category);
    const maxOrder = existing.length > 0 ? Math.max(...existing.map(e => e.sort_order)) : 0;
    const { error } = await supabase.from("system_options").insert({ category, value: val, sort_order: maxOrder + 1 });
    if (error) {
      toast({ title: "Erro", description: error.message.includes("duplicate") ? "Opção já existe" : error.message, variant: "destructive" });
      return;
    }
    setNewValues(prev => ({ ...prev, [category]: "" }));
    toast({ title: "Opção adicionada ✅" });
    loadAll();
  };

  const deleteOption = async (id: string) => {
    await supabase.from("system_options").delete().eq("id", id);
    toast({ title: "Opção removida" });
    loadAll();
  };

  const toggleExpand = (cat: string) => setExpanded(prev => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings2 className="w-6 h-6" /> Opções do Sistema
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as opções de infraestrutura, tipos, status e categorias disponíveis nos formulários
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {CATEGORIES.map(cat => {
              const items = getByCategory(cat.key);
              const isOpen = expanded[cat.key] || false;
              return (
                <div key={cat.key} className="elevated-card rounded-xl border border-border overflow-hidden">
                  <button
                    onClick={() => toggleExpand(cat.key)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      <span className="font-semibold text-card-foreground">{cat.label}</span>
                      <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {items.map(item => (
                          <div key={item.id} className="flex items-center gap-1 group">
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${cat.color} border-current/20`}>
                              {item.value}
                            </span>
                            <button
                              onClick={() => deleteOption(item.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-destructive transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        <Input
                          placeholder={`Nova opção para ${cat.label}...`}
                          value={newValues[cat.key] || ""}
                          onChange={(e) => setNewValues(prev => ({ ...prev, [cat.key]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === "Enter") addOption(cat.key); }}
                          className="max-w-xs h-8 text-sm"
                        />
                        <Button size="sm" variant="outline" onClick={() => addOption(cat.key)} className="h-8 gap-1">
                          <Plus className="w-3.5 h-3.5" /> Adicionar
                        </Button>
                      </div>
                    </div>
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
