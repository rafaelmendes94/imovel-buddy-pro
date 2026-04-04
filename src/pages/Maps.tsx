import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMapsLoader";
import {
  MapPin, Loader2, Search, X, Filter, Building2, Home, Fence, Landmark,
  BedDouble, Bath, Car, Ruler, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function formatShortPrice(price: number): string {
  if (price >= 1000000) return `${(price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1)}M`;
  if (price >= 1000) return `${(price / 1000).toFixed(0)}K`;
  return String(price);
}

const typeConfig: Record<string, { emoji: string; color: string; label: string }> = {
  Apartamento: { emoji: "🏢", color: "#2563eb", label: "Apartamento" },
  Casa: { emoji: "🏠", color: "#059669", label: "Casa" },
  Comercial: { emoji: "🏪", color: "#d97706", label: "Comercial" },
  Terreno: { emoji: "🌳", color: "#7c3aed", label: "Terreno" },
  Lote: { emoji: "📐", color: "#8b5cf6", label: "Lote" },
  Cobertura: { emoji: "🏙️", color: "#0891b2", label: "Cobertura" },
  Sobrado: { emoji: "🏡", color: "#16a34a", label: "Sobrado" },
  Kitnet: { emoji: "🛏️", color: "#f59e0b", label: "Kitnet" },
  Sala: { emoji: "💼", color: "#6366f1", label: "Sala" },
  Loja: { emoji: "🛒", color: "#ea580c", label: "Loja" },
  Galpão: { emoji: "🏭", color: "#78716c", label: "Galpão" },
  Condomínio: { emoji: "🏘️", color: "#0d9488", label: "Condomínio" },
};

const defaultCfg = { emoji: "📍", color: "#2563eb", label: "Outro" };

export default function Maps() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const { ready: mapsReady, loading: mapsLoading } = useGoogleMapsLoader();

  const [imoveis, setImoveis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("imoveis")
        .select("*")
        .order("created_at", { ascending: false });
      setImoveis(data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const filtered = imoveis.filter((im) => {
    if (filterType && im.tipo !== filterType) return false;
    if (filterStatus && im.status !== filterStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const searchable = `${im.titulo} ${im.endereco} ${im.bairro} ${im.cidade} ${im.empreendimento}`.toLowerCase();
      if (!searchable.includes(term)) return false;
    }
    return true;
  });

  const mappable = filtered.filter((im) => im.latitude && im.longitude && (Number(im.latitude) !== 0 || Number(im.longitude) !== 0));

  const initMap = useCallback(() => {
    if (!mapsReady || !mapRef.current) return;

    // Cleanup
    markersRef.current.forEach(m => m.map = null);
    markersRef.current = [];

    const center = mappable.length > 0
      ? { lat: Number(mappable[0].latitude), lng: Number(mappable[0].longitude) }
      : { lat: -29.75, lng: -50.10 };

    const map = new (window as any).google.maps.Map(mapRef.current, {
      center,
      zoom: mappable.length > 1 ? 12 : 15,
      mapId: "DASHBOARD_MAP",
      zoomControl: true,
      zoomControlOptions: { position: ((window as any).google.maps.ControlPosition).RIGHT_BOTTOM },
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
    });
    mapInstanceRef.current = map;
    infoWindowRef.current = new (window as any).google.maps.InfoWindow();

    mappable.forEach((im) => {
      const cfg = typeConfig[im.tipo] || defaultCfg;
      const shortPrice = formatShortPrice(im.preco);

      const pinEl = document.createElement("div");
      pinEl.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="background:${cfg.color};border-radius:6px 6px 6px 0;padding:2px 6px;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;gap:3px;white-space:nowrap;">
          <span style="font-size:10px;line-height:1;">${cfg.emoji}</span>
          <span style="font-size:9px;font-weight:800;color:#fff;letter-spacing:0.2px;">${shortPrice}</span>
        </div>
        <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${cfg.color};"></div>
      </div>`;

      const marker = new (window as any).google.maps.marker.AdvancedMarkerElement({
        position: { lat: Number(im.latitude), lng: Number(im.longitude) },
        map,
        content: pinEl,
      });
      markersRef.current.push(marker);

      const imgs = im.imagens && im.imagens.length > 0 ? im.imagens : [];
      const mainImg = imgs[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop";
      const address = [im.endereco, im.numero, im.bairro].filter(Boolean).join(", ");

      marker.addListener("click", () => {
        const popupContent = `
        <div style="width:280px;font-family:system-ui,-apple-system,sans-serif;padding:0;">
          <img src="${mainImg}" alt="${im.titulo}" style="width:100%;height:140px;object-fit:cover;border-radius:8px 8px 0 0;display:block;" />
          <div style="padding:12px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
              <span style="font-size:10px;font-weight:700;color:#fff;background:${cfg.color};padding:2px 8px;border-radius:4px;letter-spacing:0.5px;text-transform:uppercase;">${im.tipo}</span>
              <span style="font-size:10px;font-weight:600;color:${im.status === 'Disponível' ? '#059669' : im.status === 'Vendido' ? '#dc2626' : '#d97706'};">${im.status}</span>
            </div>
            <h3 style="font-size:14px;font-weight:700;margin:0 0 4px 0;color:#0f172a;line-height:1.3;text-transform:uppercase;">${im.titulo}</h3>
            <p style="font-size:11px;color:#64748b;margin:0 0 6px 0;line-height:1.4;">📍 ${address} – ${im.cidade}</p>
            ${im.empreendimento ? `<p style="font-size:10px;color:#94a3b8;margin:0 0 6px 0;">🏗 ${im.empreendimento}</p>` : ""}
            <div style="display:flex;gap:10px;margin-bottom:8px;font-size:10px;color:#64748b;">
              ${im.quartos > 0 ? `<span>🛏 ${im.quartos}</span>` : ""}
              ${im.banheiros > 0 ? `<span>🚿 ${im.banheiros}</span>` : ""}
              ${im.vagas > 0 ? `<span>🚗 ${im.vagas}</span>` : ""}
              ${im.area > 0 ? `<span>📐 ${im.area}m²</span>` : ""}
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <p style="font-size:18px;font-weight:800;color:${cfg.color};margin:0;">${formatCurrency(im.preco)}</p>
              <span id="gmaps-ver-${im.id}" style="font-size:11px;color:${cfg.color};cursor:pointer;font-weight:700;text-decoration:underline;padding:4px 8px;">Ver mais →</span>
            </div>
          </div>
        </div>`;

        infoWindowRef.current!.setContent(popupContent);
        infoWindowRef.current!.open(map, marker);

        setTimeout(() => {
          const btn = document.getElementById(`gmaps-ver-${im.id}`);
          btn?.addEventListener("click", () => setSelectedProperty(im));
        }, 100);
      });
    });

    if (mappable.length > 1) {
      const bounds = new (window as any).google.maps.LatLngBounds();
      mappable.forEach((im) => bounds.extend({ lat: Number(im.latitude), lng: Number(im.longitude) }));
      map.fitBounds(bounds, 40);
    }
  }, [mappable, mapsReady]);

  useEffect(() => {
    if (loading || mappable.length === 0 || !mapsReady) return;
    initMap();
    return () => {
      markersRef.current.forEach(m => m.map = null);
      markersRef.current = [];
    };
  }, [loading, initMap, mapsReady]);

  const types = [...new Set(imoveis.map((im) => im.tipo).filter(Boolean))];
  const statuses = [...new Set(imoveis.map((im) => im.status).filter(Boolean))];

  if (loading || mapsLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mapa de Imóveis</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{mappable.length} imóveis com localização • {imoveis.length} total</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por título, endereço, bairro..." className="pl-9" />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border",
            showFilters || filterType || filterStatus ? "bg-accent text-accent-foreground border-accent" : "bg-secondary text-secondary-foreground border-border"
          )}>
            <Filter className="w-4 h-4" /> Filtros
            {(filterType || filterStatus) && <span className="w-2 h-2 rounded-full bg-destructive" />}
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-card border border-border">
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setFilterType("")} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors", !filterType ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-secondary")}>Todos</button>
              {types.map((t) => (
                <button key={t} onClick={() => setFilterType(filterType === t ? "" : t)} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors", filterType === t ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-secondary")}>{t}</button>
              ))}
            </div>
            <div className="w-px bg-border mx-1" />
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setFilterStatus("")} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors", !filterStatus ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-secondary")}>Todos Status</button>
              {statuses.map((s) => (
                <button key={s} onClick={() => setFilterStatus(filterStatus === s ? "" : s)} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors", filterStatus === s ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-secondary")}>{s}</button>
              ))}
            </div>
            {(filterType || filterStatus) && (
              <button onClick={() => { setFilterType(""); setFilterStatus(""); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors ml-auto">Limpar</button>
            )}
          </div>
        )}

        {mappable.length > 0 ? (
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden relative border border-border shadow-sm h-[500px] sm:h-[650px]">
              <div className="absolute top-4 left-4 z-10">
                <div className="bg-card/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 border border-border flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[11px] font-bold text-foreground">{mappable.length} imóveis no mapa</span>
                </div>
              </div>
              <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
            </div>

            {/* Legenda */}
            {(() => {
              const activeTypes = [...new Set(mappable.map(im => im.tipo).filter(Boolean))];
              return activeTypes.length > 0 ? (
                <div className="flex flex-wrap gap-2 px-1">
                  {activeTypes.map((type) => {
                    const cfg = typeConfig[type] || defaultCfg;
                    return (
                      <div key={type} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card border border-border text-xs font-medium">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                        <span>{cfg.emoji}</span>
                        <span className="text-foreground">{cfg.label}</span>
                      </div>
                    );
                  })}
                </div>
              ) : null;
            })()}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <MapPin className="w-16 h-16 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-semibold">Nenhum imóvel com coordenadas</p>
            <p className="text-sm mt-1">Cadastre latitude e longitude nos imóveis para vê-los no mapa</p>
          </div>
        )}

        {selectedProperty && (
          <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4" onClick={() => setSelectedProperty(null)}>
            <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="relative h-56">
                <img
                  src={(selectedProperty.imagens && selectedProperty.imagens.length > 0 ? selectedProperty.imagens[0] : null) || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop"}
                  alt={selectedProperty.titulo}
                  className="w-full h-full object-cover"
                />
                <button onClick={() => setSelectedProperty(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center">
                  <X className="w-4 h-4 text-foreground" />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p className="text-xl font-bold text-white">{formatCurrency(selectedProperty.preco)}</p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold text-white" style={{ background: (typeConfig[selectedProperty.tipo] || defaultCfg).color }}>{selectedProperty.tipo}</span>
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold",
                      selectedProperty.status === 'Disponível' ? "bg-success/10 text-success" :
                      selectedProperty.status === 'Vendido' ? "bg-destructive/10 text-destructive" :
                      "bg-warning/10 text-warning"
                    )}>{selectedProperty.status}</span>
                  </div>
                  <h2 className="text-lg font-bold text-card-foreground uppercase">{selectedProperty.titulo}</h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {[selectedProperty.endereco, selectedProperty.numero, selectedProperty.bairro, selectedProperty.cidade].filter(Boolean).join(", ")}
                  </p>
                </div>

                {selectedProperty.empreendimento && (
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-accent" />
                    <span className="text-sm font-semibold text-foreground">{selectedProperty.empreendimento}</span>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-3">
                  {selectedProperty.quartos > 0 && (
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <BedDouble className="w-4 h-4 mx-auto text-accent mb-1" />
                      <p className="text-xs font-bold text-foreground">{selectedProperty.quartos}</p>
                      <p className="text-[10px] text-muted-foreground">Quartos</p>
                    </div>
                  )}
                  {selectedProperty.banheiros > 0 && (
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <Bath className="w-4 h-4 mx-auto text-accent mb-1" />
                      <p className="text-xs font-bold text-foreground">{selectedProperty.banheiros}</p>
                      <p className="text-[10px] text-muted-foreground">Banheiros</p>
                    </div>
                  )}
                  {selectedProperty.vagas > 0 && (
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <Car className="w-4 h-4 mx-auto text-accent mb-1" />
                      <p className="text-xs font-bold text-foreground">{selectedProperty.vagas}</p>
                      <p className="text-[10px] text-muted-foreground">Vagas</p>
                    </div>
                  )}
                  {selectedProperty.area > 0 && (
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <Ruler className="w-4 h-4 mx-auto text-accent mb-1" />
                      <p className="text-xs font-bold text-foreground">{selectedProperty.area}m²</p>
                      <p className="text-[10px] text-muted-foreground">Área</p>
                    </div>
                  )}
                </div>

                {selectedProperty.descricao && (
                  <p className="text-sm text-muted-foreground line-clamp-3">{selectedProperty.descricao}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setSelectedProperty(null); navigate(`/editar-imovel/${selectedProperty.id}`); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Eye className="w-4 h-4" /> Ver Detalhes
                  </button>
                  <button onClick={() => setSelectedProperty(null)} className="px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
