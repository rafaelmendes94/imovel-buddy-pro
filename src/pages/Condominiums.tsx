import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { InfraMediaModal } from "@/components/InfraMediaModal";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/data/mockData";
import {
  Fence, Plus, Search, MapPin, Home, Edit, Trash2, Camera, Map, Loader2,
} from "lucide-react";

const typeColors: Record<string, string> = {
  Horizontal: "bg-success/10 text-success border-success/30",
  Vertical: "bg-info/10 text-info border-info/30",
  Misto: "bg-warning/10 text-warning border-warning/30",
};

interface CondoRow {
  id: string; nome: string; endereco: string; cidade: string; total_unidades: number;
  unidades_disponiveis: number; taxa_condominio: number; amenidades: string[];
  tipo: string; imagem_url: string; latitude: number; longitude: number; user_id: string;
}

export default function Condominiums() {
  const [condos, setCondos] = useState<CondoRow[]>([]);
  const [search, setSearch] = useState("");
  const [mediaCondo, setMediaCondo] = useState<CondoRow | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSuperAdmin, isAdminStaff } = useAuth();
  const canManage = isSuperAdmin || isAdminStaff;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data } = await supabase.from("condominios").select("*").order("nome");
    if (data) setCondos(data as any);
    setLoading(false);
  };

  const filtered = condos.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    (c.endereco || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    await supabase.from("condominios").delete().eq("id", id);
    toast({ title: "Condomínio excluído" });
    loadData();
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <BackButton />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Condomínios</h1>
            <p className="text-sm text-muted-foreground mt-1">{condos.length} condomínios cadastrados</p>
          </div>
          {canManage && (
            <button onClick={() => navigate("/cadastro-condominio")} className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-gold text-primary text-sm font-semibold hover:opacity-90 transition-opacity self-start">
              <Plus className="w-4 h-4" /> Novo Condomínio
            </button>
          )}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar condomínio..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((condo) => (
              <div key={condo.id} className="elevated-card rounded-xl overflow-hidden group cursor-pointer" onClick={() => navigate(`/condominios/${condo.id}`)}>
                <div className="relative h-44 overflow-hidden">
                  <img src={condo.imagem_url || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop"} alt={condo.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className={cn("absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-semibold border", typeColors[condo.tipo] || "bg-muted text-muted-foreground")}>{condo.tipo}</span>
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/editar-condominio/${condo.id}`); }} className="w-7 h-7 rounded-md bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"><Edit className="w-3.5 h-3.5 text-foreground" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(condo.id); }} className="w-7 h-7 rounded-md bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-destructive/90 transition-colors"><Trash2 className="w-3.5 h-3.5 text-foreground" /></button>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-card-foreground text-sm">{condo.nome}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{condo.endereco}, {condo.cidade}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-base font-bold text-accent">{formatCurrency(condo.taxa_condominio)}<span className="text-xs text-muted-foreground font-normal">/mês</span></p>
                    <span className="text-xs text-success font-semibold">{condo.unidades_disponiveis} disponíveis</span>
                  </div>
                  {condo.amenidades && condo.amenidades.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
                      {condo.amenidades.map(a => (
                        <span key={a} className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{a}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/condominios/${condo.id}`); }} className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg bg-emerald-500/15 text-emerald-500 text-xs font-semibold hover:bg-emerald-500/25 transition-colors border border-emerald-500/30">
                      <Home className="w-3.5 h-3.5" /> Imóveis
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setMediaCondo(condo); }} className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg bg-gradient-to-r from-foreground/10 to-foreground/5 text-foreground text-xs font-semibold hover:from-foreground/20 hover:to-foreground/10 transition-all border border-foreground/20">
                      <Camera className="w-3.5 h-3.5" /> Mídia
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps?q=${condo.latitude},${condo.longitude}`, "_blank"); }} className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg bg-info/10 text-info text-xs font-semibold hover:bg-info/20 transition-colors border border-info/20">
                      <Map className="w-3.5 h-3.5" /> Mapa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <InfraMediaModal open={!!mediaCondo} onClose={() => setMediaCondo(null)} title={mediaCondo?.nome || ""} media={[]} />

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Fence className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum condomínio encontrado</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
