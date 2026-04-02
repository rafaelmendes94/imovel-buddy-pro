import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MiniMap } from "@/components/MiniMap";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/data/mockData";
import {
  ArrowLeft, Building, MapPin, Layers, Calendar, Wrench, Edit,
  BedDouble, Bath, Car, Ruler, Home, Share2, ExternalLink, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusColors: Record<string, string> = {
  "Em construção": "bg-warning/10 text-warning border-warning/30",
  Pronto: "bg-success/10 text-success border-success/30",
  Lançamento: "bg-info/10 text-info border-info/30",
};

const imovelStatusColors: Record<string, string> = {
  Disponível: "bg-success/10 text-success border-success/30",
  Vendido: "bg-destructive/10 text-destructive border-destructive/30",
  Reservado: "bg-warning/10 text-warning border-warning/30",
  Alugado: "bg-info/10 text-info border-info/30",
};

export default function BuildingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [building, setBuilding] = useState<any>(null);
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      const [bRes, iRes] = await Promise.all([
        supabase.from("edificios").select("*").eq("id", id).maybeSingle(),
        supabase.from("imoveis").select("*").eq("edificio_id", id),
      ]);
      if (bRes.data) setBuilding(bRes.data);
      if (iRes.data) setImoveis(iRes.data);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!building) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-muted-foreground">
          <Building className="w-16 h-16 mx-auto mb-4 opacity-40" />
          <p className="text-lg">Edifício não encontrado</p>
          <Link to="/edificios" className="text-accent hover:underline mt-2 inline-block">Voltar</Link>
        </div>
      </AppLayout>
    );
  }

  const fullAddress = [building.endereco, building.numero, building.complemento, building.bairro, building.cidade, building.estado].filter(Boolean).join(", ");

  function shareWhatsApp() {
    const text = `🏢 ${building.nome}\n📍 ${fullAddress}\n🔗 ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/edificios" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{building.nome}</h1>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{fullAddress}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start">
            <button onClick={shareWhatsApp} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-success text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              <Share2 className="w-4 h-4" /> WhatsApp
            </button>
            <button onClick={() => navigate(`/editar-edificio/${building.id}`)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              <Edit className="w-4 h-4" /> Editar
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="rounded-xl overflow-hidden h-64">
          <img src={building.imagem_url || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop"} alt={building.nome} className="w-full h-full object-cover" />
        </div>

        {/* Info Bar */}
        <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-card border border-border">
          {building.status && (
            <span className={cn("px-2.5 py-1 rounded-md text-xs font-semibold border", statusColors[building.status] || "bg-muted text-muted-foreground")}>{building.status}</span>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Layers className="w-4 h-4 text-accent" />{building.andares} andares</div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Building className="w-4 h-4 text-accent" />{building.total_unidades} unidades</div>
          {building.construtora && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Wrench className="w-4 h-4 text-accent" />{building.construtora}</div>}
          {building.ano_construcao && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="w-4 h-4 text-accent" />Ano {building.ano_construcao}</div>}
          {building.cep && <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-4 h-4 text-accent" />CEP {building.cep}</div>}
        </div>

        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="imoveis">Imóveis Vinculados ({imoveis.length})</TabsTrigger>
            <TabsTrigger value="localizacao">Localização</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            {building.descricao && (
              <div className="p-4 rounded-xl bg-card border border-border">
                <h3 className="text-sm font-semibold text-foreground mb-2">Descrição</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{building.descricao}</p>
              </div>
            )}
            {building.infraestrutura && building.infraestrutura.length > 0 && (
              <div className="p-4 rounded-xl bg-card border border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">Infraestrutura</h3>
                <div className="flex flex-wrap gap-2">
                  {building.infraestrutura.map((i: string) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-accent/10 text-accent border border-accent/20">{i}</span>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="imoveis" className="space-y-4">
            {imoveis.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Home className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Nenhum imóvel vinculado a este edifício</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {imoveis.map((im) => (
                  <div key={im.id} onClick={() => navigate(`/editar-imovel/${im.id}`)} className="elevated-card rounded-xl overflow-hidden cursor-pointer group">
                    <div className="relative h-36 overflow-hidden">
                      <img src={im.imagens?.[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop"} alt={im.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <span className={cn("absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold border", imovelStatusColors[im.status] || "bg-muted text-muted-foreground")}>{im.status}</span>
                    </div>
                    <div className="p-3 space-y-2">
                      <h4 className="font-semibold text-card-foreground text-sm truncate">{im.titulo}</h4>
                      <p className="text-base font-bold text-accent">{formatCurrency(im.preco)}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" /> {im.quartos}</span>
                        <span className="flex items-center gap-1"><Bath className="w-3 h-3" /> {im.banheiros}</span>
                        <span className="flex items-center gap-1"><Car className="w-3 h-3" /> {im.vagas}</span>
                        <span className="flex items-center gap-1"><Ruler className="w-3 h-3" /> {im.area}m²</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="localizacao" className="space-y-3">
            {Number(building.latitude) !== 0 && Number(building.longitude) !== 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-accent" /> Localização
                  </h3>
                  <a href={`https://www.google.com/maps?q=${building.latitude},${building.longitude}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-info/10 text-info text-xs font-semibold hover:bg-info/20 transition-colors border border-info/20">
                    <ExternalLink className="w-3 h-3" /> Google Maps
                  </a>
                </div>
                <MiniMap lat={Number(building.latitude)} lng={Number(building.longitude)} name={building.nome} height="400px" />
                <p className="text-xs text-muted-foreground text-center">{fullAddress}</p>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Coordenadas não cadastradas</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}