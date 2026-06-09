import { PLACEHOLDER_IMAGE } from "@/lib/placeholderImage";
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MiniMap } from "@/components/MiniMap";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/data/mockData";
import {
  ArrowLeft, Building, MapPin, Layers, Calendar, Wrench, Edit,
  BedDouble, Bath, Car, Ruler, Home, Share2, ExternalLink, Loader2,
  Camera, Building2, Video, FolderDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaGalleryView } from "@/components/MediaGalleryView";
import { useSmartBack } from "@/lib/useSmartBack";

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
  const handleBack = useSmartBack("/edificios");
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
          <button onClick={handleBack} className="text-accent hover:underline mt-2 inline-block">Voltar</button>
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
            <button onClick={handleBack} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
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
          {(building as any).unidades_por_andar > 0 && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Layers className="w-4 h-4 text-accent" />{(building as any).unidades_por_andar} unidades/andar</div>}
          {building.construtora && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Wrench className="w-4 h-4 text-accent" />{building.construtora}</div>}
          {building.ano_construcao && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="w-4 h-4 text-accent" />Ano {building.ano_construcao}</div>}
          {building.cep && <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-4 h-4 text-accent" />CEP {building.cep}</div>}
        </div>

        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="midias">Mídias</TabsTrigger>
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

          <TabsContent value="midias" className="space-y-4">
            <MediaGalleryView title="Fotos do Empreendimento" icon={Camera} items={building.fotos_empreendimento || []} kind="image" emptyText="Nenhuma foto cadastrada" />
            <MediaGalleryView title="Fotos da Infraestrutura" icon={Building2} items={building.fotos_infra || []} kind="image" emptyText="Nenhuma foto cadastrada" />
            <MediaGalleryView title="Vídeos" icon={Video} items={building.videos || []} kind="video" emptyText="Nenhum vídeo cadastrado" />
            <MediaGalleryView title="Material Digital" icon={FolderDown} items={building.material_digital || []} kind="file" emptyText="Nenhum material disponível" />
          </TabsContent>
          <TabsContent value="imoveis" className="space-y-4">
            {imoveis.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Home className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Nenhum imóvel vinculado a este edifício</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-3">{imoveis.length} imóvel(is)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {imoveis.map((im) => {
                    const imgs = im.imagens && im.imagens.length > 0 ? im.imagens : [PLACEHOLDER_IMAGE];
                    const conditions = im.condicoes_pagamento || [];
                    return (
                      <div key={im.id} onClick={() => navigate(`/editar-imovel/${im.id}`)} className="elevated-card rounded-xl overflow-hidden cursor-pointer group flex flex-col">
                        <div className="relative h-44 overflow-hidden">
                          <img src={imgs[0]} alt={im.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          {im.proprietario_tipo && (
                            <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-success text-success-foreground">{im.proprietario_tipo}</span>
                          )}
                          <span className={cn("absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-semibold border", imovelStatusColors[im.status] || "bg-muted text-muted-foreground")}>{im.status}</span>
                          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between">
                            <p className="text-lg font-bold text-white drop-shadow-lg">{formatCurrency(im.preco)}</p>
                            <div className="flex gap-1">
                              {im.vista_mar && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-info/90 text-info-foreground">Mar</span>}
                              {im.decorado && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/90 text-white">Dec.</span>}
                            </div>
                          </div>
                        </div>
                        <div className="p-3.5 space-y-2.5 flex-1 flex flex-col">
                          <h4 className="font-bold text-card-foreground text-sm leading-tight uppercase">{im.titulo}</h4>
                          {im.empreendimento && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[11px] font-bold text-card-foreground bg-muted px-2 py-0.5 rounded border border-border uppercase">{im.empreendimento}</span>
                              {im.unidade && <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">{im.unidade}</span>}
                              {im.box && <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">{im.box}</span>}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{im.endereco}, {im.cidade}</span>
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            {im.quartos > 0 && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {im.quartos}</span>}
                            {im.banheiros > 0 && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {im.banheiros}</span>}
                            {im.vagas > 0 && <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5" /> {im.vagas}</span>}
                            {im.area > 0 && <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> {im.area}m² t.</span>}
                            {im.area_privativa > 0 && <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> {im.area_privativa}m² p.</span>}
                          </div>
                          {conditions.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {conditions.map((c: string) => (
                                <span key={c} className="px-2 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success border border-success/20">{c}</span>
                              ))}
                            </div>
                          )}
                          <div className="mt-auto pt-2 border-t border-border flex items-center gap-2">
                            <span className="text-xs font-semibold text-accent">{im.corretor_nome || "Corretor"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
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