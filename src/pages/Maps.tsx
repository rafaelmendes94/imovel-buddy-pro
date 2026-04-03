import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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

const typeConfig: Record<string, { emoji: string; color: string }> = {
  Apartamento: { emoji: "🏢", color: "#2563eb" },
  Casa: { emoji: "🏠", color: "#059669" },
  Comercial: { emoji: "🏪", color: "#d97706" },
  Terreno: { emoji: "🌳", color: "#7c3aed" },
  Cobertura: { emoji: "🏙️", color: "#0891b2" },
  Sobrado: { emoji: "🏡", color: "#16a34a" },
  Kitnet: { emoji: "🛏️", color: "#f59e0b" },
  Sala: { emoji: "🏢", color: "#6366f1" },
  Loja: { emoji: "🏪", color: "#ea580c" },
  Galpão: { emoji: "🏭", color: "#78716c" },
};

const defaultCfg = { emoji: "📍", color: "#2563eb" };

export default function Maps() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [imoveis, setImoveis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);

  // Load real properties
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

  // Filter properties
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

  // Only properties with valid coordinates
  const mappable = filtered.filter((im) => im.latitude && im.longitude && (Number(im.latitude) !== 0 || Number(im.longitude) !== 0));

  const initMap = useCallback(() => {
    const L = (window as any).L;
    if (!L || !mapRef.current) return;

    // Cleanup
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markersRef.current = [];
    }

    const center: [number, number] = mappable.length > 0
      ? [Number(mappable[0].latitude), Number(mappable[0].longitude)]
      : [-29.75, -50.10];

    const map = L.map(mapRef.current, { zoomControl: false }).setView(center, mappable.length > 1 ? 12 : 15);
    mapInstanceRef.current = map;
    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);

    mappable.forEach((im) => {
      const cfg = typeConfig[im.tipo] || defaultCfg;
      const shortPrice = formatShortPrice(im.preco);

      const icon = L.divIcon({
        className: "",
        html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);cursor:pointer;">
          <div style="background:${cfg.color};border-radius:6px 6px 6px 0;padding:2px 6px;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;gap:3px;white-space:nowrap;">
            <span style="font-size:10px;line-height:1;">${cfg.emoji}</span>
            <span style="font-size:9px;font-weight:800;color:#fff;letter-spacing:0.2px;">${shortPrice}</span>
          </div>
          <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${cfg.color};"></div>
        </div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([Number(im.latitude), Number(im.longitude)], { icon }).addTo(map);
      markersRef.current.push(marker);

      const imgs = im.imagens && im.imagens.length > 0 ? im.imagens : [];
      const mainImg = imgs[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop";
      const address = [im.endereco, im.numero, im.bairro].filter(Boolean).join(", ");

      const popup = L.popup({ className: "clean-popup", maxWidth: 300, minWidth: 280, closeButton: true })
        .setContent(`
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
              <span data-imovel-id="${im.id}" style="font-size:11px;color:${cfg.color};cursor:pointer;font-weight:700;text-decoration:underline;padding:4px 8px;">Ver mais →</span>
            </div>
          </div>
        </div>
      `);

      marker.bindPopup(popup);

      marker.on("popupopen", () => {
        setTimeout(() => {
          const container = marker.getPopup()?.getElement();
          if (!container) return;
          const btn = container.querySelector(`[data-imovel-id="${im.id}"]`);
          if (btn) {
            (btn as HTMLElement).addEventListener("click", () => {
              setSelectedProperty(im);
            });
          }
        }, 10);
      });
    });

    // Fit bounds
    if (mappable.length > 1) {
      const bounds = L.latLngBounds(mappable.map((im: any) => [Number(im.latitude), Number(im.longitude)]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    // Custom popup style
    if (!document.querySelector('#map-popup-style')) {
      const style = document.createElement("style");
      style.id = 'map-popup-style';
      style.textContent = `
        .clean-popup .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          padding: 0 !important;
          box-shadow: 0 8px 30px rgba(0,0,0,0.15) !important;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .clean-popup .leaflet-popup-content { margin: 0 !important; line-height: 1.4 !important; }
        .clean-popup .leaflet-popup-tip { box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; border: 1px solid #e2e8f0; }
        .clean-popup .leaflet-popup-close-button {
          color: #fff !important; font-size: 20px !important; width: 28px !important; height: 28px !important;
          top: 4px !important; right: 4px !important; background: rgba(0,0,0,0.3); border-radius: 50%;
          display: flex; align-items: center; justify-content: center; line-height: 1; padding: 0;
        }
        .clean-popup .leaflet-popup-close-button:hover { background: rgba(0,0,0,0.5); color: #fff !important; }
      `;
      document.head.appendChild(style);
    }
  }, [mappable]);

  // Load Leaflet & init map
  useEffect(() => {
    if (loading || mappable.length === 0) return;

    const L = (window as any).L;
    if (L) {
      initMap();
    } else {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => initMap();
      document.head.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = [];
      }
    };
  }, [loading, initMap]);

  // Get unique types and statuses for filters
  const types = [...new Set(imoveis.map((im) => im.tipo).filter(Boolean))];
  const statuses = [...new Set(imoveis.map((im) => im.status).filter(Boolean))];

  if (loading) {
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mapa de Imóveis</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{mappable.length} imóveis com localização • {imoveis.length} total</p>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título, endereço, bairro..."
              className="pl-9"
            />
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

        {/* Map */}
        {mappable.length > 0 ? (
          <div className="rounded-xl overflow-hidden relative border border-border shadow-sm h-[500px] sm:h-[650px]">
            {/* Count badge */}
            <div className="absolute top-4 left-4 z-[1000]">
              <div className="bg-card/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 border border-border flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-accent" />
                <span className="text-[11px] font-bold text-foreground">{mappable.length} imóveis no mapa</span>
              </div>
            </div>
            <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <MapPin className="w-16 h-16 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-semibold">Nenhum imóvel com coordenadas</p>
            <p className="text-sm mt-1">Cadastre latitude e longitude nos imóveis para vê-los no mapa</p>
          </div>
        )}

        {/* Property detail side panel */}
        {selectedProperty && (
          <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4" onClick={() => setSelectedProperty(null)}>
            <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Image */}
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

              {/* Content */}
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
