import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import {
  Search, SlidersHorizontal, Loader2, MapPin, LocateFixed,
  BedDouble, Bath, Car, Ruler, X, ArrowLeft, RefreshCw, Navigation, ChevronUp, ChevronDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PUBLIC_IMOVEL_COLUMNS } from "@/lib/publicImovelColumns";
import { PLACEHOLDER_IMAGE } from "@/lib/placeholderImage";
import { FallbackImage } from "@/components/FallbackImage";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMapsLoader";
import { PublicMobileNav } from "@/components/PublicMobileNav";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RASTER_RENDERING, attachMapRefresh, googleMapsRouteUrl, mapMarkerSvg } from "@/lib/mapUtils";
import { toast } from "sonner";

type Imovel = {
  id: string;
  titulo: string;
  tipo: string | null;
  preco: number | null;
  quartos: number | null;
  suites: number | null;
  banheiros: number | null;
  vagas: number | null;
  area: number | null;
  area_privativa: number | null;
  bairro: string | null;
  cidade: string | null;
  endereco: string | null;
  empreendimento: string | null;
  imagens: string[] | null;
  latitude: number | null;
  longitude: number | null;
  vista_mar: boolean | null;
  decorado: boolean | null;
  aceita_permuta: boolean | null;
  condominio_id: string | null;
  condominios?: { nome: string } | null;
  edificios?: { nome: string } | null;
  empreendimentos?: { nome: string } | null;
};

const COLS = [
  "id", "titulo", "tipo", "preco", "quartos", "suites", "banheiros", "vagas",
  "area", "area_privativa", "bairro", "cidade", "endereco", "empreendimento",
  "imagens", "latitude", "longitude", "vista_mar", "decorado", "aceita_permuta",
  "condominio_id",
].join(", ");

void PUBLIC_IMOVEL_COLUMNS;

function fmtPrice(v: number | null) {
  if (!v || v <= 0) return "Consulte";
  if (v >= 1_000_000) {
    const mi = v / 1_000_000;
    return `R$ ${mi.toFixed(mi % 1 === 0 ? 0 : 1).replace(".", ",")} mi`;
  }
  if (v >= 1000) return `R$ ${Math.round(v / 1000)} mil`;
  return `R$ ${v}`;
}

function fmtFull(v: number | null) {
  if (!v || v <= 0) return "Preço a consultar";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function empName(im: Imovel) {
  return im.empreendimentos?.nome || im.edificios?.nome || im.condominios?.nome || im.empreendimento || "";
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function ExplorarMapa() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { ready: mapsReady, loading: mapsLoading, error: mapsError, retry: retryMaps } = useGoogleMapsLoader();

  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const clustererRef = useRef<any>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [visibleIds, setVisibleIds] = useState<string[] | null>(null);
  const [showSearchArea, setShowSearchArea] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [resultLimit, setResultLimit] = useState(60);
  const dragStartYRef = useRef<number | null>(null);

  // filtros
  const [term, setTerm] = useState(params.get("busca") || "");
  const [fType, setFType] = useState("");
  const [fCity, setFCity] = useState("");
  const [fNeighborhood, setFNeighborhood] = useState("");
  const [fMin, setFMin] = useState("");
  const [fMax, setFMax] = useState("");
  const [fRooms, setFRooms] = useState(0);
  const [fSuites, setFSuites] = useState(0);
  const [fParking, setFParking] = useState(0);
  const [fAreaMin, setFAreaMin] = useState("");
  const [fSeaView, setFSeaView] = useState(false);
  const [fDecorated, setFDecorated] = useState(false);
  const [fSwap, setFSwap] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await (supabase.from("imoveis") as any)
        .select(`${COLS}, edificios(nome), condominios(nome), empreendimentos(nome)`)
        .eq("ativo_site", true)
        .eq("status", "Disponível")
        .order("created_at", { ascending: false })
        .limit(500);
      if (!cancelled) {
        setImoveis((data || []).filter((r: Imovel) => Number(r.latitude) && Number(r.longitude)));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const types = useMemo(() => [...new Set(imoveis.map((i) => i.tipo).filter(Boolean))] as string[], [imoveis]);
  const cities = useMemo(() => [...new Set(imoveis.map((i) => i.cidade).filter(Boolean))].sort() as string[], [imoveis]);
  const neighborhoods = useMemo(
    () => [...new Set(imoveis.filter((i) => !fCity || i.cidade === fCity).map((i) => i.bairro).filter(Boolean))].sort() as string[],
    [imoveis, fCity]
  );

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    return imoveis.filter((im) => {
      if (fType && im.tipo !== fType) return false;
      if (fCity && im.cidade !== fCity) return false;
      if (fNeighborhood && im.bairro !== fNeighborhood) return false;
      if (fMin && Number(im.preco || 0) < Number(fMin)) return false;
      if (fMax && Number(im.preco || 0) > Number(fMax)) return false;
      if (fRooms && Number(im.quartos || 0) < fRooms) return false;
      if (fSuites && Number(im.suites || 0) < fSuites) return false;
      if (fParking && Number(im.vagas || 0) < fParking) return false;
      if (fAreaMin && Number(im.area_privativa || im.area || 0) < Number(fAreaMin)) return false;
      if (fSeaView && !im.vista_mar) return false;
      if (fDecorated && !im.decorado) return false;
      if (fSwap && !im.aceita_permuta) return false;
      if (t) {
        const hay = `${im.titulo} ${im.endereco} ${im.bairro} ${im.cidade} ${empName(im)}`.toLowerCase();
        if (!hay.includes(t)) return false;
      }
      return true;
    });
  }, [imoveis, term, fType, fCity, fNeighborhood, fMin, fMax, fRooms, fSuites, fParking, fAreaMin, fSeaView, fDecorated, fSwap]);

  const listed = useMemo(() => {
    const base = visibleIds ? filtered.filter((im) => visibleIds.includes(im.id)) : filtered;
    if (!myPos) return base;
    return [...base].sort(
      (a, b) =>
        distanceKm(myPos, { lat: Number(a.latitude), lng: Number(a.longitude) }) -
        distanceKm(myPos, { lat: Number(b.latitude), lng: Number(b.longitude) })
    );
  }, [filtered, visibleIds, myPos]);

  const clearFilters = () => {
    setTerm(""); setFType(""); setFCity(""); setFNeighborhood(""); setFMin(""); setFMax("");
    setFRooms(0); setFSuites(0); setFParking(0); setFAreaMin("");
    setFSeaView(false); setFDecorated(false); setFSwap(false);
    setVisibleIds(null);
    setResultLimit(60);
  };

  const fitToProperties = useCallback((items: Imovel[]) => {
    const g = (window as any).google;
    if (!g || !mapRef.current || items.length === 0) return;
    if (items.length === 1) {
      mapRef.current.setCenter({ lat: Number(items[0].latitude), lng: Number(items[0].longitude) });
      mapRef.current.setZoom(15);
      return;
    }
    const bounds = new g.maps.LatLngBounds();
    items.forEach((im) => bounds.extend({ lat: Number(im.latitude), lng: Number(im.longitude) }));
    mapRef.current.fitBounds(bounds, 60);
  }, []);

  // init map
  useEffect(() => {
    if (!mapsReady || !mapDivRef.current || mapRef.current) return;
    const g = (window as any).google;
    mapRef.current = new g.maps.Map(mapDivRef.current, {
      ...RASTER_RENDERING,
      center: { lat: -29.75, lng: -50.02 },
      zoom: 12,
      clickableIcons: false,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      gestureHandling: "greedy",
      zoomControl: true,
      zoomControlOptions: { position: g.maps.ControlPosition.RIGHT_BOTTOM },
      styles: [
        { featureType: "poi.business", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
      ],
    });
    mapRef.current.addListener("dragend", () => setShowSearchArea(true));
    mapRef.current.addListener("zoom_changed", () => setShowSearchArea(true));
    mapRef.current.addListener("click", () => setSelectedId(null));
    const detach = attachMapRefresh(mapRef.current, mapDivRef.current);
    return () => detach();
  }, [mapsReady]);

  // markers
  useEffect(() => {
    const g = (window as any).google;
    if (!g || !mapRef.current) return;

    if (clustererRef.current) clustererRef.current.clearMarkers();
    Object.values(markersRef.current).forEach((m: any) => m.setMap(null));
    markersRef.current = {};

    const markers = filtered.map((im) => {
      const active = im.id === selectedId || im.id === hoverId;
      const markerIcon = mapMarkerSvg(fmtPrice(im.preco), active);
      const marker = new g.maps.Marker({
        position: { lat: Number(im.latitude), lng: Number(im.longitude) },
        title: im.titulo,
        zIndex: active ? 999 : 1,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markerIcon.svg)}`,
          scaledSize: new g.maps.Size(markerIcon.width, markerIcon.height),
          anchor: new g.maps.Point(markerIcon.width / 2, markerIcon.height - 2),
        },
      });
      marker.addListener("click", () => {
        setSelectedId(im.id);
        setSheetExpanded(false);
        mapRef.current?.panTo({ lat: Number(im.latitude), lng: Number(im.longitude) });
      });
      markersRef.current[im.id] = marker;
      return marker;
    });

    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({ map: mapRef.current, markers });
    } else {
      clustererRef.current.addMarkers(markers);
    }
  }, [filtered, selectedId, hoverId, mapsReady]);

  // enquadramento inicial nos imóveis
  const framedRef = useRef(false);
  useEffect(() => {
    if (framedRef.current || loading || !mapRef.current || filtered.length === 0) return;
    framedRef.current = true;
    fitToProperties(filtered);
  }, [loading, filtered, fitToProperties, mapsReady]);

  // scroll list to selection
  useEffect(() => {
    if (!selectedId) return;
    document.getElementById(`map-card-${selectedId}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    document.getElementById(`map-slide-${selectedId}`)?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedId]);

  const searchThisArea = () => {
    const b = mapRef.current?.getBounds();
    if (!b) return;
    setVisibleIds(
      filtered
        .filter((im) => b.contains({ lat: Number(im.latitude), lng: Number(im.longitude) }))
        .map((im) => im.id)
    );
    setShowSearchArea(false);
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Localização não disponível neste aparelho.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        setMyPos(pos);
        mapRef.current?.panTo(pos);
        mapRef.current?.setZoom(14);
      },
      () => toast.error("Não foi possível acessar sua localização. Verifique a permissão do navegador."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const selected = listed.find((i) => i.id === selectedId) || filtered.find((i) => i.id === selectedId) || null;
  const activeFilters =
    (fType ? 1 : 0) + (fCity ? 1 : 0) + (fNeighborhood ? 1 : 0) + (fMin ? 1 : 0) + (fMax ? 1 : 0) +
    (fRooms ? 1 : 0) + (fSuites ? 1 : 0) + (fParking ? 1 : 0) + (fAreaMin ? 1 : 0) +
    (fSeaView ? 1 : 0) + (fDecorated ? 1 : 0) + (fSwap ? 1 : 0);

  const activeChips = [
    fType && { label: fType, clear: () => setFType("") },
    fCity && { label: fCity, clear: () => { setFCity(""); setFNeighborhood(""); } },
    fNeighborhood && { label: fNeighborhood, clear: () => setFNeighborhood("") },
    fRooms > 0 && { label: `${fRooms}+ dorm.`, clear: () => setFRooms(0) },
    fSuites > 0 && { label: `${fSuites}+ suítes`, clear: () => setFSuites(0) },
    fParking > 0 && { label: `${fParking}+ vagas`, clear: () => setFParking(0) },
    fSeaView && { label: "Vista mar", clear: () => setFSeaView(false) },
    fDecorated && { label: "Decorado", clear: () => setFDecorated(false) },
    fSwap && { label: "Aceita permuta", clear: () => setFSwap(false) },
  ].filter(Boolean) as Array<{ label: string; clear: () => void }>;

  const Card = ({ im, compact }: { im: Imovel; compact?: boolean }) => {
    const dist = myPos ? distanceKm(myPos, { lat: Number(im.latitude), lng: Number(im.longitude) }) : null;
    return (
      <button
        id={compact ? `map-slide-${im.id}` : `map-card-${im.id}`}
        onMouseEnter={() => setHoverId(im.id)}
        onMouseLeave={() => setHoverId(null)}
        onClick={() => {
          setSelectedId(im.id);
          mapRef.current?.panTo({ lat: Number(im.latitude), lng: Number(im.longitude) });
        }}
        className={cn(
          "text-left w-full bg-card rounded-2xl overflow-hidden border transition-all",
          compact ? "min-w-[264px] max-w-[264px] snap-center shadow-lg" : "shadow-sm hover:shadow-md",
          im.id === selectedId ? "border-primary ring-2 ring-primary/25" : "border-border/70"
        )}
      >
        <div className={cn("relative w-full overflow-hidden bg-muted", compact ? "aspect-[16/9]" : "aspect-[4/3]")}>
          <FallbackImage
            src={im.imagens?.[0] || PLACEHOLDER_IMAGE}
            sources={im.imagens || []}
            alt={im.titulo}
            loading="lazy"
            className="w-full h-full object-cover"
          />
          {im.tipo && (
            <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wide bg-card/95 text-foreground px-2 py-1 rounded-full">
              {im.tipo}
            </span>
          )}
        </div>
        <div className="p-3 space-y-1.5">
          <p className="text-base font-extrabold text-foreground leading-none">{fmtFull(im.preco)}</p>
          <p className="text-[13px] font-semibold text-foreground line-clamp-1">{im.titulo}</p>
          {empName(im) && <p className="text-[11px] text-muted-foreground line-clamp-1">{empName(im)}</p>}
          <p className="text-[11px] text-muted-foreground line-clamp-1">
            {[im.bairro, im.cidade].filter(Boolean).join(" • ")}
            {dist !== null && ` • ${dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`} de mim`}
          </p>
          <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
            {!!im.quartos && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{im.quartos}</span>}
            {!!im.suites && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{im.suites} suíte{im.suites > 1 ? "s" : ""}</span>}
            {!!im.vagas && <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5" />{im.vagas}</span>}
            {!!(im.area_privativa || im.area) && (
              <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" />{Number(im.area_privativa || im.area)} m²</span>
            )}
          </div>
          {(compact || im.id === selectedId) && (
            <div className="grid grid-cols-[1fr_auto] gap-2 pt-2">
              <Button size="sm" className="h-10 rounded-xl font-bold" onClick={(e) => { e.stopPropagation(); navigate(`/imovel/${im.id}`); }}>
                Ver imóvel
              </Button>
              <Button size="icon" variant="outline" className="h-10 w-10 rounded-xl" asChild onClick={(e) => e.stopPropagation()}>
                <a href={googleMapsRouteUrl(Number(im.latitude), Number(im.longitude))} target="_blank" rel="noopener noreferrer" aria-label={`Traçar rota para ${im.titulo}`} title="Traçar rota">
                  <Navigation className="h-4 w-4" />
                </a>
              </Button>
            </div>
          )}
        </div>
      </button>
    );
  };

  const chips = (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
      <button
        onClick={() => setFType("")}
        className={cn("shrink-0 px-3.5 h-9 rounded-full text-xs font-bold border transition-colors",
          !fType ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border")}
      >
        Comprar
      </button>
      {types.slice(0, 6).map((t) => (
        <button
          key={t}
          onClick={() => setFType(fType === t ? "" : t)}
          className={cn("shrink-0 px-3.5 h-9 rounded-full text-xs font-semibold border transition-colors",
            fType === t ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border")}
        >
          {t}
        </button>
      ))}
      <button
        onClick={() => setMoreOpen(true)}
        className={cn("shrink-0 flex items-center gap-1.5 px-3.5 h-9 rounded-full text-xs font-bold border transition-colors",
          activeFilters ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border")}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        Mais filtros{activeFilters ? ` (${activeFilters})` : ""}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Topo */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-3 sm:px-5 py-3 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="shrink-0 w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Onde você quer morar? Cidade, bairro ou empreendimento"
                className="pl-9 h-11 rounded-full bg-card"
              />
              {term && (
                <button onClick={() => setTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <span className="hidden lg:block text-xs font-semibold text-muted-foreground whitespace-nowrap">
              {listed.length} imóveis
            </span>
          </div>
          {chips}
          {activeChips.length > 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar" aria-label="Filtros ativos">
              {activeChips.map((chip) => (
                <button key={chip.label} onClick={chip.clear} className="flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {chip.label}<X className="h-3 w-3" aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Corpo */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mapa */}
        <div
          className={cn(
            "relative lg:w-[65%] w-full",
            "h-[calc(100dvh-190px-env(safe-area-inset-bottom))] min-h-[430px] lg:h-[calc(100vh-124px)]",
          )}
        >
          <div ref={mapDivRef} className="w-full h-full" />
          {(mapsLoading || loading) && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
            </div>
          )}
          {mapsError && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background p-6 text-center" role="alert">
              <div>
                <MapPin className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-bold">Mapa indisponível</p>
                <p className="mt-1 text-sm text-muted-foreground">{mapsError}</p>
                <Button type="button" variant="outline" className="mt-4 h-11" onClick={retryMaps}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
                </Button>
              </div>
            </div>
          )}

          {showSearchArea && (
            <button
              onClick={searchThisArea}
              className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 h-10 rounded-full bg-card shadow-lg border border-border text-xs font-bold hover:bg-muted"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Buscar nesta área
            </button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={locateMe}
            className="absolute bottom-28 left-3 z-20 h-11 rounded-full bg-card px-3.5 text-xs font-bold shadow-lg lg:bottom-4 lg:left-4"
            aria-label="Usar minha localização"
          >
            <LocateFixed className="w-4 h-4" /> Minha localização
          </Button>

          {visibleIds && (
            <button
              onClick={() => { setVisibleIds(null); fitToProperties(filtered); }}
              className="absolute top-3 right-3 z-20 px-3 h-9 rounded-full bg-card shadow border border-border text-[11px] font-bold hover:bg-muted"
            >
              Ver toda a região
            </button>
          )}

          {/* Card selecionado (desktop) */}
          {selected && (
            <div className="hidden lg:block absolute bottom-4 right-4 z-20 w-[300px]">
              <div className="relative">
                <button
                  onClick={() => setSelectedId(null)}
                  className="absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full bg-card border border-border shadow flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <Card im={selected} compact />
              </div>
            </div>
          )}

          {/* Bottom sheet móvel — arraste a alça ou toque para expandir */}
          <section
            className={cn("lg:hidden absolute inset-x-0 bottom-0 z-30 rounded-t-2xl border-t border-border bg-background/98 shadow-2xl backdrop-blur transition-[height] duration-300", sheetExpanded ? "h-[72%]" : selected ? "h-[252px]" : "h-[92px]")}
            aria-label="Resultados no mapa"
            onPointerDown={(e) => { dragStartYRef.current = e.clientY; }}
            onPointerUp={(e) => {
              if (dragStartYRef.current === null) return;
              const delta = e.clientY - dragStartYRef.current;
              if (delta < -35) setSheetExpanded(true);
              if (delta > 35) setSheetExpanded(false);
              dragStartYRef.current = null;
            }}
          >
            <button type="button" onClick={() => setSheetExpanded((value) => !value)} className="flex h-12 w-full items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" aria-expanded={sheetExpanded} aria-label={sheetExpanded ? "Recolher resultados" : "Expandir resultados"}>
              <span className="h-1.5 w-12 rounded-full bg-border" />
              <span className="text-xs font-bold text-muted-foreground">{listed.length} resultados</span>
              {sheetExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
            <div className="h-[calc(100%-48px)] overflow-y-auto px-3 pb-[calc(88px+env(safe-area-inset-bottom))]">
              {!sheetExpanded && selected ? <Card im={selected} compact /> : !sheetExpanded ? (
                <button type="button" onClick={() => setSheetExpanded(true)} className="w-full rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-semibold">Toque ou arraste para ver os imóveis desta área</button>
              ) : (
                <div className="space-y-2">
                  {listed.slice(0, resultLimit).map((im) => <Card key={im.id} im={im} />)}
                  {listed.length > resultLimit && <Button variant="outline" className="h-11 w-full" onClick={() => setResultLimit((value) => value + 60)}>Carregar mais</Button>}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Lista */}
        <aside
          className={cn(
            "lg:w-[35%] w-full border-l border-border bg-muted/30 overflow-y-auto",
            "h-[calc(100dvh-190px-env(safe-area-inset-bottom))] lg:h-[calc(100vh-124px)]",
            "hidden lg:block"
          )}
          ref={listRef}
        >
          <div className="p-3 sm:p-4 space-y-3 pb-24 lg:pb-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-1">
              {listed.length} imóve{listed.length === 1 ? "l" : "is"} nesta área
            </p>
            {listed.length === 0 ? (
              <div className="text-center py-16 px-6">
                <MapPin className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="font-bold text-foreground">Nenhum imóvel encontrado nesta área.</p>
                <p className="text-sm text-muted-foreground mt-1">Afaste o mapa ou altere os filtros.</p>
                <Button variant="outline" className="mt-4 rounded-full" onClick={clearFilters}>Limpar filtros</Button>
              </div>
            ) : (
              listed.slice(0, resultLimit).map((im) => <Card key={im.id} im={im} />)
            )}
          </div>
        </aside>
      </div>

      {/* Mais filtros */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[88vh] overflow-y-auto lg:max-w-lg lg:mx-auto">
          <SheetHeader>
            <SheetTitle>Mais filtros</SheetTitle>
          </SheetHeader>
          <div className="space-y-5 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground">Cidade</label>
                <select value={fCity} onChange={(e) => { setFCity(e.target.value); setFNeighborhood(""); }}
                  className="mt-1 w-full h-11 rounded-xl border border-border bg-card px-3 text-sm">
                  <option value="">Todas</option>
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground">Bairro</label>
                <select value={fNeighborhood} onChange={(e) => setFNeighborhood(e.target.value)}
                  className="mt-1 w-full h-11 rounded-xl border border-border bg-card px-3 text-sm">
                  <option value="">Todos</option>
                  {neighborhoods.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground">Tipo</label>
                <select value={fType} onChange={(e) => setFType(e.target.value)}
                  className="mt-1 w-full h-11 rounded-xl border border-border bg-card px-3 text-sm">
                  <option value="">Todos</option>
                  {types.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground">Área mínima (m²)</label>
                <Input value={fAreaMin} onChange={(e) => setFAreaMin(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="mt-1 h-11 rounded-xl" placeholder="0" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground">Preço mínimo</label>
                <Input value={fMin} onChange={(e) => setFMin(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="mt-1 h-11 rounded-xl" placeholder="R$" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground">Preço máximo</label>
                <Input value={fMax} onChange={(e) => setFMax(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="mt-1 h-11 rounded-xl" placeholder="R$" />
              </div>
            </div>

            {[
              { label: "Dormitórios", value: fRooms, set: setFRooms },
              { label: "Suítes", value: fSuites, set: setFSuites },
              { label: "Vagas", value: fParking, set: setFParking },
            ].map((row) => (
              <div key={row.label}>
                <label className="text-xs font-bold text-muted-foreground">{row.label}</label>
                <div className="flex gap-2 mt-1.5">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => row.set(n)}
                      className={cn("flex-1 h-10 rounded-xl text-xs font-bold border transition-colors",
                        row.value === n ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border")}
                    >
                      {n === 0 ? "Todos" : `${n}+`}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex flex-wrap gap-2">
              {[
                { label: "Vista mar", on: fSeaView, set: setFSeaView },
                { label: "Mobiliado/decorado", on: fDecorated, set: setFDecorated },
                { label: "Aceita permuta", on: fSwap, set: setFSwap },
              ].map((c) => (
                <button
                  key={c.label}
                  onClick={() => c.set(!c.on)}
                  className={cn("px-3.5 h-9 rounded-full text-xs font-semibold border transition-colors",
                    c.on ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border")}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="rounded-xl h-12" onClick={clearFilters}>Limpar</Button>
              <Button className="flex-1 rounded-xl h-12 font-bold" onClick={() => setMoreOpen(false)}>
                Mostrar {filtered.length} imóveis
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <PublicMobileNav />
    </div>
  );
}
