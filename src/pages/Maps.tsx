import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { LocateFixed, MapPin, Navigation, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMapsLoader";
import { PLACEHOLDER_IMAGE } from "@/lib/placeholderImage";
import { attachMapRefresh, formatMapPrice, googleMapsRouteUrl, hasValidCoordinates, mapMarkerSvg } from "@/lib/mapUtils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PropertyRow = {
  id: string; titulo: string; tipo: string | null; status: string | null; preco: number | null;
  endereco: string | null; numero: string | null; bairro: string | null; cidade: string | null;
  latitude: number | null; longitude: number | null; imagens: string[] | null;
};

export default function Maps() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { ready, loading: mapsLoading, error: mapsError, retry: retryMaps } = useGoogleMapsLoader();
  const mapNodeRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSearchArea, setShowSearchArea] = useState(false);
  const [areaIds, setAreaIds] = useState<string[] | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("imoveis")
        .select("id,titulo,tipo,status,preco,endereco,numero,bairro,cidade,latitude,longitude,imagens")
        .order("created_at", { ascending: false }).limit(500);
      if (!active) return;
      if (error) toast.error("Não foi possível carregar os imóveis do mapa.");
      setProperties(((data || []) as PropertyRow[]).filter((item) => hasValidCoordinates(item.latitude, item.longitude)));
      setLoading(false);
    })();
    return () => { active = false; };
  }, [user]);

  const types = useMemo(() => [...new Set(properties.map((item) => item.tipo).filter(Boolean))] as string[], [properties]);
  const statuses = useMemo(() => [...new Set(properties.map((item) => item.status).filter(Boolean))] as string[], [properties]);
  const filtered = useMemo(() => properties.filter((item) => {
    if (type && item.tipo !== type) return false;
    if (status && item.status !== status) return false;
    const q = term.trim().toLowerCase();
    return !q || `${item.titulo} ${item.endereco || ""} ${item.bairro || ""} ${item.cidade || ""}`.toLowerCase().includes(q);
  }), [properties, term, type, status]);
  const listed = useMemo(() => areaIds ? filtered.filter((item) => areaIds.includes(item.id)) : filtered, [filtered, areaIds]);
  const selected = filtered.find((item) => item.id === selectedId) || null;

  const fitItems = useCallback((items: PropertyRow[]) => {
    const maps = (window as any).google?.maps;
    if (!maps || !mapRef.current || !items.length) return;
    if (items.length === 1) {
      mapRef.current.setCenter({ lat: Number(items[0].latitude), lng: Number(items[0].longitude) });
      mapRef.current.setZoom(15);
      return;
    }
    const bounds = new maps.LatLngBounds();
    items.forEach((item) => bounds.extend({ lat: Number(item.latitude), lng: Number(item.longitude) }));
    mapRef.current.fitBounds(bounds, 52);
  }, []);

  useEffect(() => {
    const maps = (window as any).google?.maps;
    if (!ready || !maps || !mapNodeRef.current || mapRef.current) return;
    const map = new maps.Map(mapNodeRef.current, {
      center: { lat: -29.75, lng: -50.02 }, zoom: 12, clickableIcons: false,
      streetViewControl: false, mapTypeControl: false, fullscreenControl: false,
      zoomControl: true, gestureHandling: "greedy",
      zoomControlOptions: { position: maps.ControlPosition.RIGHT_BOTTOM },
    });
    map.addListener("dragend", () => setShowSearchArea(true));
    map.addListener("zoom_changed", () => setShowSearchArea(true));
    map.addListener("click", () => setSelectedId(null));
    mapRef.current = map;
  }, [ready]);

  useEffect(() => {
    const maps = (window as any).google?.maps;
    if (!maps || !mapRef.current) return;
    clustererRef.current?.clearMarkers();
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();
    const markers = filtered.map((item) => {
      const iconData = mapMarkerSvg(item.preco ? formatMapPrice(item.preco) : item.tipo || "Imóvel", item.id === selectedId);
      const marker = new maps.Marker({
        position: { lat: Number(item.latitude), lng: Number(item.longitude) }, title: item.titulo,
        zIndex: item.id === selectedId ? 999 : 1,
        icon: { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(iconData.svg)}`, scaledSize: new maps.Size(iconData.width, iconData.height), anchor: new maps.Point(iconData.width / 2, iconData.height - 2) },
      });
      marker.addListener("click", () => {
        setSelectedId(item.id); setSheetOpen(false);
        mapRef.current?.panTo({ lat: Number(item.latitude), lng: Number(item.longitude) });
      });
      markersRef.current.set(item.id, marker);
      return marker;
    });
    clustererRef.current = new MarkerClusterer({ map: mapRef.current, markers });
    return () => { clustererRef.current?.clearMarkers(); markers.forEach((marker) => marker.setMap(null)); };
  }, [filtered, selectedId, ready]);

  const framed = useRef(false);
  useEffect(() => {
    if (!framed.current && !loading && mapRef.current && filtered.length) { framed.current = true; fitItems(filtered); }
  }, [filtered, loading, fitItems]);

  const searchArea = () => {
    const bounds = mapRef.current?.getBounds();
    if (!bounds) return;
    setAreaIds(filtered.filter((item) => bounds.contains({ lat: Number(item.latitude), lng: Number(item.longitude) })).map((item) => item.id));
    setShowSearchArea(false);
  };
  const locate = () => {
    if (!navigator.geolocation) { toast.error("Localização não disponível neste aparelho."); return; }
    navigator.geolocation.getCurrentPosition((position) => {
      mapRef.current?.panTo({ lat: position.coords.latitude, lng: position.coords.longitude }); mapRef.current?.setZoom(14);
    }, () => toast.error("Não foi possível acessar sua localização."), { enableHighAccuracy: true, timeout: 10000 });
  };

  const ResultCard = ({ item, compact = false }: { item: PropertyRow; compact?: boolean }) => (
    <article className={cn("overflow-hidden rounded-xl border bg-card", item.id === selectedId ? "border-primary ring-2 ring-primary/20" : "border-border", compact ? "grid grid-cols-[104px_1fr]" : "grid grid-cols-[116px_1fr]") }>
      <img src={item.imagens?.[0] || PLACEHOLDER_IMAGE} alt={item.titulo} loading="lazy" className="h-full min-h-28 w-full object-cover" />
      <div className="min-w-0 p-3">
        <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase text-primary">{item.tipo || "Imóvel"}</span><span className="text-[10px] text-muted-foreground">{item.status}</span></div>
        <h2 className="mt-1 line-clamp-1 text-sm font-bold">{item.titulo}</h2>
        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{[item.endereco, item.numero, item.bairro, item.cidade].filter(Boolean).join(", ")}</p>
        <p className="mt-1 text-sm font-black text-primary">{item.preco ? item.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) : "Preço a consultar"}</p>
        <div className="mt-2 flex gap-2">
          <Button size="sm" className="h-9 flex-1" onClick={() => navigate(`/imovel/${item.id}`)}>Abrir detalhes</Button>
          <Button size="icon" variant="outline" className="h-9 w-9" asChild>
            <a href={googleMapsRouteUrl(Number(item.latitude), Number(item.longitude))} target="_blank" rel="noopener noreferrer" aria-label={`Traçar rota para ${item.titulo}`}><Navigation className="h-4 w-4" /></a>
          </Button>
        </div>
      </div>
    </article>
  );

  return (
    <AppLayout>
      <div className="flex h-[calc(100dvh-132px-env(safe-area-inset-bottom))] min-h-[520px] flex-col overflow-hidden lg:h-screen lg:min-h-0">
        <header className="z-20 border-b border-border bg-background px-3 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={term} onChange={(e) => setTerm(e.target.value)} className="h-11 pl-9 pr-9" placeholder="Buscar imóvel, rua, bairro ou cidade" aria-label="Buscar no mapa" />{term && <button onClick={() => setTerm("")} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center" aria-label="Limpar busca"><X className="h-4 w-4" /></button>}</div>
            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" aria-label="Limpar filtros" onClick={() => { setType(""); setStatus(""); setAreaIds(null); }}><SlidersHorizontal className="h-4 w-4" /></Button>
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar" aria-label="Filtros do mapa">
            <button onClick={() => setType("")} className={cn("h-9 shrink-0 rounded-full border px-3 text-xs font-semibold", !type ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>Todos os tipos</button>
            {types.map((value) => <button key={value} onClick={() => setType(type === value ? "" : value)} className={cn("h-9 shrink-0 rounded-full border px-3 text-xs font-semibold", type === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>{value}</button>)}
            {statuses.map((value) => <button key={value} onClick={() => setStatus(status === value ? "" : value)} className={cn("h-9 shrink-0 rounded-full border px-3 text-xs font-semibold", status === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>{value}</button>)}
          </div>
        </header>
        <div className="relative flex min-h-0 flex-1">
          <div className="relative min-w-0 flex-1">
            <div ref={mapNodeRef} className="h-full w-full" />
            {(loading || mapsLoading) && <div className="absolute inset-0 z-30 grid place-items-center bg-background/75"><p className="text-sm font-semibold text-muted-foreground">Carregando mapa…</p></div>}
            {mapsError && <div className="absolute inset-0 z-30 grid place-items-center bg-background p-6 text-center" role="alert"><div><MapPin className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><p className="font-bold">Mapa indisponível</p><p className="mt-1 text-sm text-muted-foreground">{mapsError}</p><Button variant="outline" className="mt-4 h-11" onClick={retryMaps}><RefreshCw className="mr-2 h-4 w-4" />Tentar novamente</Button></div></div>}
            {showSearchArea && <Button onClick={searchArea} className="absolute left-1/2 top-3 z-20 h-10 -translate-x-1/2 rounded-full shadow-lg"><RefreshCw className="mr-2 h-4 w-4" />Buscar nesta área</Button>}
            <Button onClick={locate} variant="secondary" className="absolute bottom-28 left-3 z-20 h-11 rounded-full shadow-lg lg:bottom-4" aria-label="Usar minha localização"><LocateFixed className="mr-2 h-4 w-4" />Minha localização</Button>
            {areaIds && <Button onClick={() => { setAreaIds(null); fitItems(filtered); }} variant="outline" size="sm" className="absolute right-3 top-3 z-20 bg-card shadow">Ver toda a região</Button>}

            <section className={cn("absolute inset-x-0 bottom-0 z-20 rounded-t-2xl border-t border-border bg-background shadow-2xl transition-[height] lg:hidden", sheetOpen ? "h-[68%]" : selected ? "h-[226px]" : "h-[82px]")} aria-label="Resultados do mapa">
              <button onClick={() => setSheetOpen((value) => !value)} className="flex h-12 w-full items-center justify-center gap-2" aria-expanded={sheetOpen}><span className="h-1.5 w-12 rounded-full bg-border" /><span className="text-xs font-bold text-muted-foreground">{listed.length} imóveis</span></button>
              <div className="h-[calc(100%-48px)] space-y-2 overflow-y-auto px-3 pb-[calc(82px+env(safe-area-inset-bottom))]">
                {sheetOpen ? listed.slice(0, 100).map((item) => <button key={item.id} className="block w-full text-left" onClick={() => { setSelectedId(item.id); setSheetOpen(false); mapRef.current?.panTo({ lat: Number(item.latitude), lng: Number(item.longitude) }); }}><ResultCard item={item} /></button>) : selected ? <ResultCard item={selected} compact /> : <button onClick={() => setSheetOpen(true)} className="w-full rounded-xl border border-border bg-card p-3 text-sm font-semibold">Toque para ver os imóveis desta área</button>}
              </div>
            </section>
          </div>
          <aside className="hidden w-[380px] shrink-0 overflow-y-auto border-l border-border bg-muted/30 p-3 lg:block">
            <p className="mb-3 text-xs font-bold uppercase text-muted-foreground">{listed.length} imóveis nesta área</p>
            <div className="space-y-2">{listed.slice(0, 150).map((item) => <button key={item.id} className="block w-full text-left" onClick={() => { setSelectedId(item.id); mapRef.current?.panTo({ lat: Number(item.latitude), lng: Number(item.longitude) }); }}><ResultCard item={item} /></button>)}</div>
            {!listed.length && <div className="py-16 text-center text-sm text-muted-foreground"><MapPin className="mx-auto mb-3 h-10 w-10 opacity-40" />Nenhum imóvel nesta área.</div>}
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}