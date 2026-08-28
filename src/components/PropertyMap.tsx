import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Property, formatCurrency } from "@/data/mockData";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMapsLoader";
import { BedDouble, Bath, Car, Loader2, LocateFixed, MapPin, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PropertyMapProps {
  properties: Property[];
  onSelectProperty?: (property: Property) => void;
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

/** Haversine distance in km */
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace(".", ",")} km`;
}

function markerSvg(color: string, shortPrice: string, selected: boolean) {
  const w = selected ? 84 : 72;
  const h = selected ? 40 : 34;
  const rw = w - 4;
  const rh = selected ? 26 : 22;
  const tipY = rh + 2;
  const cx = w / 2;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">
      <rect x="2" y="2" width="${rw}" height="${rh}" rx="${rh / 2}" fill="${color}" stroke="${selected ? "#0f172a" : "#ffffff"}" stroke-width="${selected ? 2.5 : 1.5}" />
      <path d="M${cx - 5} ${tipY}H${cx + 5}L${cx} ${tipY + 8}L${cx - 5} ${tipY}Z" fill="${color}" stroke="${selected ? "#0f172a" : "#ffffff"}" stroke-width="${selected ? 2 : 1}" />
      <text x="${cx}" y="${rh / 2 + 5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${selected ? 13 : 12}" font-weight="700" fill="white">${shortPrice}</text>
    </svg>
  `.trim();
}

function buildPopup(property: Property, color: string): string {
  return `
    <div style="width:135px;font-family:system-ui,-apple-system,sans-serif;padding:0;">
      <img src="${property.image}" alt="${property.title}" style="width:100%;height:70px;object-fit:cover;border-radius:6px 6px 0 0;display:block;cursor:pointer;" />
      <div style="padding:6px;">
        <div style="display:flex;align-items:center;gap:3px;margin-bottom:3px;">
          <span style="font-size:9px;font-weight:700;color:#fff;background:${color};padding:1px 4px;border-radius:3px;letter-spacing:0.5px;text-transform:uppercase;">${property.type}</span>
          <span style="font-size:9px;font-weight:500;color:#94a3b8;">${property.status}</span>
        </div>
        <h3 style="font-size:11px;font-weight:700;margin:0 0 2px 0;color:#0f172a;line-height:1.25;">${property.title}</h3>
        <p style="font-size:9px;color:#64748b;margin:0 0 2px 0;line-height:1.3;">📍 ${property.address}${property.neighborhood ? `, ${property.neighborhood}` : ""} – ${property.city}</p>
        <div style="display:flex;gap:4px;margin-bottom:4px;font-size:9px;color:#64748b;">
          ${property.bedrooms > 0 ? `<span>🛏 ${property.bedrooms}</span>` : ""}
          ${property.bathrooms > 0 ? `<span>🚿 ${property.bathrooms}</span>` : ""}
          ${property.parking > 0 ? `<span>🚗 ${property.parking}</span>` : ""}
          <span>📐 ${property.area}m²</span>
        </div>
        <div style="display:flex;align-items:baseline;justify-content:space-between;">
          <p style="font-size:12px;font-weight:800;color:${color};margin:0;">${formatCurrency(property.price)}</p>
          <span id="gmaps-detail-${property.id}" style="font-size:9px;color:${color};cursor:pointer;font-weight:700;text-decoration:underline;">Ver →</span>
        </div>
      </div>
    </div>`;
}

export function PropertyMap({ properties, onSelectProperty }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<globalThis.Map<string, any>>(new globalThis.Map());
  const infoWindowRef = useRef<any>(null);
  const mapsRef = useRef<any>(null);
  const selectedIdRef = useRef<string | null>(null);
  const { ready, loading } = useGoogleMapsLoader();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  selectedIdRef.current = selectedId;

  // Reference point for "proximity": user location > map center > first property
  const reference = userLocation || mapCenter || (properties[0] ? { lat: properties[0].lat, lng: properties[0].lng } : null);

  const sortedByDistance = useMemo(() => {
    if (!reference) return properties;
    return [...properties].sort(
      (a, b) => distanceKm(reference, { lat: a.lat, lng: a.lng }) - distanceKm(reference, { lat: b.lat, lng: b.lng })
    );
  }, [properties, reference?.lat, reference?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateMarkerIcon = useCallback((property: Property, selected: boolean) => {
    const maps = mapsRef.current;
    const marker = markersRef.current.get(property.id);
    if (!maps || !marker) return;
    const cfg = typeConfig[property.type] || defaultCfg;
    const svg = markerSvg(cfg.color, formatShortPrice(property.price), selected);
    const w = selected ? 84 : 72;
    const h = selected ? 40 : 34;
    const icon = {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new maps.Size(w, h),
      anchor: new maps.Point(w / 2, h - 2),
    };
    if (typeof marker.setIcon === "function") marker.setIcon(icon);
    if (typeof marker.setZIndex === "function") marker.setZIndex(selected ? 999 : 1);
  }, []);

  const focusProperty = useCallback(
    (property: Property, openPopup = true) => {
      const map = mapInstanceRef.current;
      const maps = mapsRef.current;
      const marker = markersRef.current.get(property.id);
      if (!map || !maps) return;

      // Deselect previous marker
      if (selectedIdRef.current && selectedIdRef.current !== property.id) {
        const prev = properties.find((p) => p.id === selectedIdRef.current);
        if (prev) updateMarkerIcon(prev, false);
      }

      setSelectedId(property.id);
      updateMarkerIcon(property, true);

      map.panTo({ lat: property.lat, lng: property.lng });
      if (map.getZoom() < 15) map.setZoom(15);

      if (openPopup && marker && infoWindowRef.current) {
        const cfg = typeConfig[property.type] || defaultCfg;
        infoWindowRef.current.setContent(buildPopup(property, cfg.color));
        infoWindowRef.current.open({ map, anchor: marker });
        setTimeout(() => {
          const detailBtn = document.getElementById(`gmaps-detail-${property.id}`);
          detailBtn?.addEventListener("click", () => onSelectProperty?.(property), { once: true });
        }, 100);
      }
    },
    [properties, updateMarkerIcon, onSelectProperty]
  );

  const handleListClick = useCallback(
    (property: Property) => {
      focusProperty(property, true);
      // Scroll list item into view
      const el = listRef.current?.querySelector(`[data-property-id="${property.id}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    },
    [focusProperty]
  );

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada neste navegador.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setLocating(false);
        const map = mapInstanceRef.current;
        if (map) {
          map.panTo(loc);
          map.setZoom(14);
        }
        // Focus nearest property
        if (properties.length > 0) {
          const nearest = [...properties].sort(
            (a, b) => distanceKm(loc, { lat: a.lat, lng: a.lng }) - distanceKm(loc, { lat: b.lat, lng: b.lng })
          )[0];
          toast.success(`Imóvel mais próximo: ${nearest.title} (${formatDistance(distanceKm(loc, nearest))})`);
        }
      },
      () => {
        setLocating(false);
        toast.error("Não foi possível obter sua localização. Verifique a permissão do navegador.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [properties]);

  // Initialize map + markers
  useEffect(() => {
    const maps = (window as any).google?.maps;
    if (!ready || !mapRef.current || !maps) return;

    let cancelled = false;

    (async () => {
      const MapCtor =
        maps.Map ||
        (typeof maps.importLibrary === "function" ? (await maps.importLibrary("maps")).Map : null);
      if (!MapCtor || cancelled || !mapRef.current) return;

      if (typeof maps.importLibrary === "function") {
        await maps.importLibrary("marker").catch(() => null);
      }

      mapsRef.current = maps;

      const center = properties.length > 0
        ? { lat: properties[0].lat, lng: properties[0].lng }
        : { lat: -23.55, lng: -46.63 };

      const map = new MapCtor(mapRef.current, {
        center,
        zoom: 12,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        gestureHandling: "greedy",
      });
      mapInstanceRef.current = map;
      infoWindowRef.current = new maps.InfoWindow();
      setMapCenter(center);

      // Track map center so the list re-sorts by proximity as user explores
      map.addListener("idle", () => {
        const c = map.getCenter();
        if (c) setMapCenter({ lat: c.lat(), lng: c.lng() });
      });

      markersRef.current.forEach((m) => {
        if (typeof m.setMap === "function") m.setMap(null);
        else if ("map" in m) m.map = null;
      });
      markersRef.current.clear();

      properties.forEach((property) => {
        const cfg = typeConfig[property.type] || defaultCfg;
        const svg = markerSvg(cfg.color, formatShortPrice(property.price), false);
        const marker = new maps.Marker({
          position: { lat: property.lat, lng: property.lng },
          map,
          title: property.title,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
            scaledSize: new maps.Size(72, 34),
            anchor: new maps.Point(36, 32),
          },
        });

        marker.addListener("click", () => {
          focusProperty(property, true);
          const el = listRef.current?.querySelector(`[data-property-id="${property.id}"]`);
          el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });

        markersRef.current.set(property.id, marker);
      });

      if (properties.length > 1) {
        const bounds = new maps.LatLngBounds();
        properties.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
        map.fitBounds(bounds, 40);
      }
    })();

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => {
        if (typeof m.setMap === "function") m.setMap(null);
        else if ("map" in m) m.map = null;
      });
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, properties]);

  if (loading) {
    return (
      <div className="rounded-xl overflow-hidden relative border border-border shadow-sm h-[400px] sm:h-[600px] flex items-center justify-center bg-muted">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeTypes = [...new Set(properties.map((p) => p.type))];

  const listCard = (property: Property) => {
    const cfg = typeConfig[property.type] || defaultCfg;
    const isSelected = selectedId === property.id;
    const dist = reference ? distanceKm(reference, { lat: property.lat, lng: property.lng }) : null;
    return (
      <button
        key={property.id}
        data-property-id={property.id}
        onClick={() => handleListClick(property)}
        className={`w-full text-left flex gap-3 p-2.5 rounded-xl border transition-all ${
          isSelected
            ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary"
            : "border-border bg-card hover:border-primary/50 hover:shadow-sm"
        }`}
      >
        <div className="w-24 sm:w-28 aspect-[4/3] rounded-lg overflow-hidden flex-shrink-0 bg-muted">
          <img src={property.image} alt={property.title} className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded uppercase tracking-wide"
              style={{ backgroundColor: cfg.color }}
            >
              {property.type}
            </span>
            {dist !== null && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" /> {formatDistance(dist)}
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-foreground truncate leading-tight">{property.title}</p>
          <p className="text-[10px] text-muted-foreground truncate">
            {property.neighborhood ? `${property.neighborhood} – ` : ""}{property.city}
          </p>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
            {property.bedrooms > 0 && <span className="flex items-center gap-0.5"><BedDouble className="w-3 h-3" />{property.bedrooms}</span>}
            {property.bathrooms > 0 && <span className="flex items-center gap-0.5"><Bath className="w-3 h-3" />{property.bathrooms}</span>}
            {property.parking > 0 && <span className="flex items-center gap-0.5"><Car className="w-3 h-3" />{property.parking}</span>}
            <span className="flex items-center gap-0.5"><Ruler className="w-3 h-3" />{property.area}m²</span>
          </div>
          <p className="text-sm font-extrabold mt-auto" style={{ color: cfg.color }}>
            {formatCurrency(property.price)}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-3">
      {/* App-style split view: list + map side by side on desktop, map with bottom list on mobile */}
      <div className="flex flex-col lg:flex-row gap-3 lg:h-[640px]">
        {/* Map */}
        <div className="relative rounded-xl overflow-hidden border border-border shadow-sm h-[380px] lg:h-full lg:flex-1 order-1">
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <div className="bg-card/95 backdrop-blur-sm rounded-full shadow-lg px-3 py-1.5 border border-border flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-foreground">{properties.length}</span>
              <span className="text-[10px] text-muted-foreground">imóveis</span>
            </div>
          </div>
          <div className="absolute top-3 right-3 z-10">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleLocateMe}
              disabled={locating}
              className="rounded-full shadow-lg gap-1.5 text-xs"
            >
              {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
              Imóveis próximos
            </Button>
          </div>
          <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
        </div>

        {/* Nearby list — desktop sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-[380px] lg:flex-shrink-0 order-2 rounded-xl border border-border bg-muted/30">
          <div className="px-3 py-2.5 border-b border-border">
            <p className="text-xs font-bold text-foreground">
              {userLocation ? "Imóveis mais próximos de você" : "Imóveis próximos ao centro do mapa"}
            </p>
            <p className="text-[10px] text-muted-foreground">Toque em um imóvel para ver no mapa</p>
          </div>
          <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-2">
            {sortedByDistance.map(listCard)}
          </div>
        </div>

        {/* Nearby list — mobile horizontal strip */}
        <div className="lg:hidden order-2">
          <p className="text-[11px] font-semibold text-muted-foreground mb-2 px-1">
            {userLocation ? "Mais próximos de você" : "Próximos ao centro do mapa"} — toque para ver no mapa
          </p>
          <div ref={listRef} className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory -mx-1 px-1">
            {sortedByDistance.map((p) => (
              <div key={p.id} className="w-[290px] flex-shrink-0 snap-start">
                {listCard(p)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {activeTypes.length > 0 && (
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
      )}
    </div>
  );
}
