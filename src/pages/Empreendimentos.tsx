import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Landmark, Plus, Search, MapPin, Edit, Trash2, Loader2, Calendar, Building2,
} from "lucide-react";

const statusColors: Record<string, string> = {
  "Em construção": "bg-warning/10 text-warning border-warning/30",
  Pronto: "bg-success/10 text-success border-success/30",
  Lançamento: "bg-info/10 text-info border-info/30",
  "Em vendas": "bg-accent/10 text-accent border-accent/30",
};

interface EmpreendimentoRow {
  id: string; nome: string; endereco: string; cidade: string; construtora: string;
  tipo: string; status: string; total_unidades: number; previsao_entrega: string;
  infraestrutura: string[]; descricao: string; imagem_url: string;
  latitude: number; longitude: number; user_id: string;
}

export default function Empreendimentos() {
  const [items, setItems] = useState<EmpreendimentoRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data } = await supabase.from("empreendimentos").select("*").order("nome");
    if (data) setItems(data as any);
    setLoading(false);
  };

  const filtered = items.filter(e =>
    e.nome.toLowerCase().includes(search.toLowerCase()) ||
    (e.cidade || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    await supabase.from("empreendimentos").delete().eq("id", id);
    toast({ title: "Loteamento excluído" });
    loadData();
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <BackButton />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Loteamentos</h1>
            <p className="text-sm text-muted-foreground mt-1">{items.length} loteamentos cadastrados</p>
          </div>
          <button onClick={() => navigate("/cadastro-empreendimento")} className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-gold text-primary text-sm font-semibold hover:opacity-90 transition-opacity self-start">
            <Plus className="w-4 h-4" /> Novo Loteamento
          </button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar loteamento..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((emp) => (
              <div key={emp.id} className="elevated-card rounded-xl overflow-hidden group cursor-pointer" onClick={() => navigate(`/empreendimentos/${emp.id}`)}>
                <div className="relative h-44 overflow-hidden">
                  <img src={emp.imagem_url || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop"} alt={emp.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className={cn("absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-semibold border", statusColors[emp.status] || "bg-muted text-muted-foreground")}>{emp.status}</span>
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <button onClick={() => navigate(`/editar-empreendimento/${emp.id}`)} className="w-7 h-7 rounded-md bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"><Edit className="w-3.5 h-3.5 text-foreground" /></button>
                    <button onClick={() => handleDelete(emp.id)} className="w-7 h-7 rounded-md bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-destructive/90 transition-colors"><Trash2 className="w-3.5 h-3.5 text-foreground" /></button>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-card-foreground text-sm">{emp.nome}</h3>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{emp.endereco}, {emp.cidade}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                    <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {emp.total_unidades} unid.</span>
                    <span>{emp.tipo}</span>
                    {emp.construtora && <span>{emp.construtora}</span>}
                    {emp.previsao_entrega && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {emp.previsao_entrega}</span>}
                  </div>
                  {emp.infraestrutura && emp.infraestrutura.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {emp.infraestrutura.slice(0, 4).map(i => (
                        <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{i}</span>
                      ))}
                      {emp.infraestrutura.length > 4 && <span className="text-[10px] text-muted-foreground">+{emp.infraestrutura.length - 4}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Landmark className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum loteamento encontrado</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
