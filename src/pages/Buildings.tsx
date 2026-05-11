import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { InfraMediaModal } from "@/components/InfraMediaModal";
import { cn } from "@/lib/utils";
import {
  Building, Plus, Search, MapPin, Layers, Edit, Trash2, Camera, Home, Map, Loader2,
} from "lucide-react";

const statusColors: Record<string, string> = {
  "Em construção": "bg-warning/10 text-warning border-warning/30",
  Pronto: "bg-success/10 text-success border-success/30",
  Lançamento: "bg-info/10 text-info border-info/30",
};

interface BuildingRow {
  id: string; nome: string; endereco: string; cep: string; numero: string; complemento: string;
  bairro: string; cidade: string; estado: string; andares: number; total_unidades: number;
  construtora: string; ano_construcao: string; status: string; imagem_url: string;
  latitude: number; longitude: number; infraestrutura: string[]; user_id: string;
}

export default function Buildings() {
  const [buildings, setBuildings] = useState<BuildingRow[]>([]);
  const [search, setSearch] = useState("");
  const [mediaBuilding, setMediaBuilding] = useState<BuildingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSuperAdmin, isAdminStaff } = useAuth();
  const canManage = isSuperAdmin || isAdminStaff;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data } = await supabase.from("edificios").select("*").order("nome");
    if (data) setBuildings(data as any);
    setLoading(false);
  };

  const filtered = buildings.filter(b =>
    b.nome.toLowerCase().includes(search.toLowerCase()) ||
    (b.endereco || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    await supabase.from("edificios").delete().eq("id", id);
    toast({ title: "Edifício excluído" });
    loadData();
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <BackButton />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edifícios</h1>
            <p className="text-sm text-muted-foreground mt-1">{buildings.length} edifícios cadastrados</p>
          </div>
          {canManage && (
            <button onClick={() => navigate("/cadastro-edificio")} className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-gold text-primary text-sm font-semibold hover:opacity-90 transition-opacity self-start">
              <Plus className="w-4 h-4" /> Novo Edifício
            </button>
          )}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar edifício..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((building) => (
              <div key={building.id} className="elevated-card rounded-xl overflow-hidden group cursor-pointer" onClick={() => navigate(`/edificios/${building.id}`)}>
                <div className="relative h-44 overflow-hidden">
                  <img src={building.imagem_url || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop"} alt={building.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className={cn("absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-semibold border", statusColors[building.status] || "bg-muted text-muted-foreground")}>{building.status}</span>
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/editar-edificio/${building.id}`); }} className="w-7 h-7 rounded-md bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"><Edit className="w-3.5 h-3.5 text-foreground" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(building.id); }} className="w-7 h-7 rounded-md bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-destructive/90 transition-colors"><Trash2 className="w-3.5 h-3.5 text-foreground" /></button>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-card-foreground text-sm">{building.nome}</h3>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{building.endereco}{building.numero ? `, ${building.numero}` : ""}, {building.cidade}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                    <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {building.andares} andares</span>
                    <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" /> {building.total_unidades} unid.</span>
                    {building.construtora && <span>{building.construtora}</span>}
                  </div>
                  {building.infraestrutura && building.infraestrutura.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {building.infraestrutura.slice(0, 4).map(i => (
                        <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{i}</span>
                      ))}
                      {building.infraestrutura.length > 4 && <span className="text-[10px] text-muted-foreground">+{building.infraestrutura.length - 4}</span>}
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/edificios/${building.id}`); }} className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg bg-emerald-500/15 text-emerald-500 text-xs font-semibold hover:bg-emerald-500/25 transition-colors border border-emerald-500/30">
                      <Home className="w-3.5 h-3.5" /> Imóveis
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setMediaBuilding(building); }} className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg bg-gradient-to-r from-foreground/10 to-foreground/5 text-foreground text-xs font-semibold hover:from-foreground/20 hover:to-foreground/10 transition-all border border-foreground/20">
                      <Camera className="w-3.5 h-3.5" /> Mídia
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps?q=${building.latitude},${building.longitude}`, "_blank"); }} className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg bg-info/10 text-info text-xs font-semibold hover:bg-info/20 transition-colors border border-info/20">
                      <Map className="w-3.5 h-3.5" /> Mapa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <InfraMediaModal open={!!mediaBuilding} onClose={() => setMediaBuilding(null)} title={mediaBuilding?.nome || ""} media={[]} />

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Building className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum edifício encontrado</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
