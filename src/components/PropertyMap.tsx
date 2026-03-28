import { useEffect, useRef, useState } from "react";
import { Property, formatCurrency } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface PropertyMapProps {
  properties: Property[];
}

function formatShortPrice(price: number): string {
  if (price >= 1000000) return `${(price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1)}M`;
  if (price >= 1000) return `${(price / 1000).toFixed(0)}K`;
  return String(price);
}

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function PropertyMap({ properties }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circleRef = useRef<any>(null);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [nearbyRadius, setNearbyRadius] = useState(2);
  const [nearbyCenter, setNearbyCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyCount, setNearbyCount] = useState(0);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;

      const center: [number, number] =
        properties.length > 0
          ? [properties[0].lat, properties[0].lng]
          : [-23.55, -46.63];

      const map = L.map(mapRef.current, {
        zoomControl: false,
      }).setView(center, 11);
      mapInstanceRef.current = map;

      // Zoom control bottom-right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Clean map style (CartoDB Positron)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      const typeConfig: Record<string, { emoji: string; color: string }> = {
        Apartamento: { emoji: "🏢", color: "#2563eb" },
        Casa: { emoji: "🏠", color: "#059669" },
        Comercial: { emoji: "🏪", color: "#d97706" },
        Terreno: { emoji: "🌳", color: "#7c3aed" },
      };

      properties.forEach((property) => {
        const cfg = typeConfig[property.type] || typeConfig.Apartamento;
        const shortPrice = formatShortPrice(property.price);

        const icon = L.divIcon({
          className: "",
          html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);cursor:pointer;">
            <div style="background:${cfg.color};border-radius:6px 6px 6px 0;padding:2px 5px;box-shadow:0 1px 6px rgba(0,0,0,0.2);display:flex;align-items:center;gap:2px;white-space:nowrap;">
              <span style="font-size:9px;line-height:1;">${cfg.emoji}</span>
              <span style="font-size:8px;font-weight:800;color:#fff;letter-spacing:0.2px;">${shortPrice}</span>
            </div>
            <div style="width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid ${cfg.color};"></div>
          </div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const marker = L.marker([property.lat, property.lng], { icon }).addTo(map);
        (marker as any)._propertyData = property;
        markersRef.current.push(marker);

        marker.bindPopup(`
          <div style="width:250px;font-family:system-ui,-apple-system,sans-serif;padding:0;">
            <img src="${property.image}" alt="${property.title}" style="width:100%;height:120px;object-fit:cover;border-radius:8px 8px 0 0;display:block;" />
            <div style="padding:12px;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="font-size:10px;font-weight:700;color:#fff;background:${cfg.color};padding:2px 8px;border-radius:4px;letter-spacing:0.5px;text-transform:uppercase;">${property.type}</span>
                <span style="font-size:10px;font-weight:500;color:#94a3b8;">${property.status}</span>
              </div>
              <h3 style="font-size:14px;font-weight:700;margin:0 0 4px 0;color:#0f172a;line-height:1.3;">${property.title}</h3>
              <p style="font-size:11px;color:#64748b;margin:0 0 8px 0;line-height:1.4;">📍 ${property.address}${property.neighborhood ? `, ${property.neighborhood}` : ""} – ${property.city}</p>
              <div style="display:flex;align-items:baseline;justify-content:space-between;">
                <p style="font-size:18px;font-weight:800;color:${cfg.color};margin:0;">${formatCurrency(property.price)}</p>
                <p style="font-size:11px;color:#94a3b8;margin:0;">
                  ${property.bedrooms > 0 ? `${property.bedrooms}🛏` : ""} ${property.area}m²
                </p>
              </div>
            </div>
          </div>
        `, { className: "clean-popup", maxWidth: 260, minWidth: 250, closeButton: true });
      });

      // Custom popup style
      const style = document.createElement("style");
      style.textContent = `
        .clean-popup .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          padding: 0 !important;
          box-shadow: 0 8px 30px rgba(0,0,0,0.15) !important;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .clean-popup .leaflet-popup-content {
          margin: 0 !important;
          line-height: 1.4 !important;
        }
        .clean-popup .leaflet-popup-tip {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
          border: 1px solid #e2e8f0;
        }
        .clean-popup .leaflet-popup-close-button {
          color: #fff !important;
          font-size: 20px !important;
          width: 28px !important;
          height: 28px !important;
          top: 4px !important;
          right: 4px !important;
          background: rgba(0,0,0,0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          padding: 0;
        }
        .clean-popup .leaflet-popup-close-button:hover {
          background: rgba(0,0,0,0.5);
          color: #fff !important;
        }
      `;
      document.head.appendChild(style);
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = [];
      }
    };
  }, [properties]);

  // Handle nearby mode click
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = (window as any).L;
    if (!map || !L) return;

    const handleClick = (e: any) => {
      if (!nearbyMode) return;
      const { lat, lng } = e.latlng;
      setNearbyCenter({ lat, lng });

      if (circleRef.current) map.removeLayer(circleRef.current);
      circleRef.current = L.circle([lat, lng], {
        radius: nearbyRadius * 1000,
        color: "#2563eb",
        fillColor: "#2563eb",
        fillOpacity: 0.08,
        weight: 2,
      }).addTo(map);

      let count = 0;
      markersRef.current.forEach((marker) => {
        const p = (marker as any)._propertyData as Property;
        const dist = getDistance(lat, lng, p.lat, p.lng);
        const el = marker.getElement?.();
        if (dist <= nearbyRadius) {
          count++;
          if (el) { el.style.opacity = "1"; el.style.transform = "scale(1)"; }
        } else {
          if (el) { el.style.opacity = "0.2"; el.style.transform = "scale(0.8)"; }
        }
      });
      setNearbyCount(count);
    };

    map.on("click", handleClick);
    return () => { map.off("click", handleClick); };
  }, [nearbyMode, nearbyRadius]);

  const clearNearby = () => {
    setNearbyMode(false);
    setNearbyCenter(null);
    setNearbyCount(0);
    const map = mapInstanceRef.current;
    if (circleRef.current && map) {
      map.removeLayer(circleRef.current);
      circleRef.current = null;
    }
    markersRef.current.forEach((marker) => {
      const el = marker.getElement?.();
      if (el) { el.style.opacity = "1"; el.style.transform = "scale(1)"; }
    });
  };

  return (
    <div className="rounded-xl overflow-hidden relative border border-border shadow-sm h-[400px] sm:h-[600px]">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => nearbyMode ? clearNearby() : setNearbyMode(true)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-lg transition-all backdrop-blur-sm",
            nearbyMode
              ? "bg-primary text-primary-foreground"
              : "bg-card/95 text-foreground border border-border hover:bg-muted"
          )}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          {nearbyMode ? "Sair do modo" : "Buscar próximos"}
        </button>

        {nearbyMode && (
          <div className="bg-card/95 backdrop-blur-sm rounded-lg shadow-lg p-3 space-y-2.5 min-w-[190px] border border-border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Raio de busca</p>
            <div className="flex gap-1">
              {[1, 2, 5, 10].map((r) => (
                <button
                  key={r}
                  onClick={() => setNearbyRadius(r)}
                  className={cn(
                    "flex-1 px-2 py-1.5 rounded-md text-[11px] font-bold transition-all",
                    nearbyRadius === r
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {r}km
                </button>
              ))}
            </div>
            {nearbyCenter ? (
              <div className="flex items-center justify-between bg-muted/50 rounded-md px-2.5 py-1.5">
                <span className="text-[11px] font-semibold text-foreground">{nearbyCount} imóvel(is)</span>
                <span className="text-[10px] text-muted-foreground">em {nearbyRadius}km</span>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground text-center py-1">
                Clique no mapa para buscar
              </p>
            )}
          </div>
        )}
      </div>

      {/* Property count badge */}
      <div className="absolute top-4 left-4 z-[1000]">
        <div className="bg-card/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 border border-border flex items-center gap-2">
          <span className="text-[11px] font-bold text-foreground">{properties.length}</span>
          <span className="text-[10px] text-muted-foreground">imóveis no mapa</span>
        </div>
      </div>

      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
