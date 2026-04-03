import { useEffect, useRef, useState } from "react";
import { Property, formatCurrency } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMapsLoader";
import { Loader2 } from "lucide-react";

interface PropertyMapProps {
  properties: Property[];
  onSelectProperty?: (property: Property) => void;
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
};

export function PropertyMap({ properties, onSelectProperty }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const { ready, loading } = useGoogleMapsLoader();

  useEffect(() => {
    if (!ready || !mapRef.current) return;

    const center = properties.length > 0
      ? { lat: properties[0].lat, lng: properties[0].lng }
      : { lat: -23.55, lng: -46.63 };

    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 11,
      mapId: "PROPERTY_MAP",
      zoomControl: true,
      zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
    });
    mapInstanceRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();

    // Clear old markers
    markersRef.current.forEach(m => m.map = null);
    markersRef.current = [];

    properties.forEach((property) => {
      const cfg = typeConfig[property.type] || typeConfig.Apartamento;
      const shortPrice = formatShortPrice(property.price);

      const pinEl = document.createElement("div");
      pinEl.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="background:${cfg.color};border-radius:6px 6px 6px 0;padding:2px 5px;box-shadow:0 1px 6px rgba(0,0,0,0.2);display:flex;align-items:center;gap:2px;white-space:nowrap;">
          <span style="font-size:9px;line-height:1;">${cfg.emoji}</span>
          <span style="font-size:8px;font-weight:800;color:#fff;letter-spacing:0.2px;">${shortPrice}</span>
        </div>
        <div style="width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid ${cfg.color};"></div>
      </div>`;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: property.lat, lng: property.lng },
        map,
        content: pinEl,
      });

      marker.addListener("click", () => {
        const popupContent = `
          <div style="width:270px;font-family:system-ui,-apple-system,sans-serif;padding:0;">
            <img src="${property.image}" alt="${property.title}" style="width:100%;height:140px;object-fit:cover;border-radius:8px 8px 0 0;display:block;cursor:pointer;" />
            <div style="padding:12px;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="font-size:10px;font-weight:700;color:#fff;background:${cfg.color};padding:2px 8px;border-radius:4px;letter-spacing:0.5px;text-transform:uppercase;">${property.type}</span>
                <span style="font-size:10px;font-weight:500;color:#94a3b8;">${property.status}</span>
              </div>
              <h3 style="font-size:14px;font-weight:700;margin:0 0 4px 0;color:#0f172a;line-height:1.3;">${property.title}</h3>
              <p style="font-size:11px;color:#64748b;margin:0 0 4px 0;line-height:1.4;">📍 ${property.address}${property.neighborhood ? `, ${property.neighborhood}` : ""} – ${property.city}</p>
              <div style="display:flex;gap:8px;margin-bottom:8px;font-size:10px;color:#64748b;">
                ${property.bedrooms > 0 ? `<span>🛏 ${property.bedrooms}</span>` : ""}
                ${property.bathrooms > 0 ? `<span>🚿 ${property.bathrooms}</span>` : ""}
                ${property.parking > 0 ? `<span>🚗 ${property.parking}</span>` : ""}
                <span>📐 ${property.area}m²</span>
              </div>
              <div style="display:flex;align-items:baseline;justify-content:space-between;">
                <p style="font-size:18px;font-weight:800;color:${cfg.color};margin:0;">${formatCurrency(property.price)}</p>
                <span id="gmaps-detail-${property.id}" style="font-size:10px;color:${cfg.color};cursor:pointer;font-weight:700;text-decoration:underline;">Ver detalhes →</span>
              </div>
            </div>
          </div>`;

        infoWindowRef.current!.setContent(popupContent);
        infoWindowRef.current!.open(map, marker);

        setTimeout(() => {
          const detailBtn = document.getElementById(`gmaps-detail-${property.id}`);
          detailBtn?.addEventListener("click", () => onSelectProperty?.(property));
        }, 100);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds
    if (properties.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      properties.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
      map.fitBounds(bounds, 40);
    }

    return () => {
      markersRef.current.forEach(m => m.map = null);
      markersRef.current = [];
    };
  }, [ready, properties]);

  if (loading) {
    return (
      <div className="rounded-xl overflow-hidden relative border border-border shadow-sm h-[400px] sm:h-[600px] flex items-center justify-center bg-muted">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden relative border border-border shadow-sm h-[400px] sm:h-[600px]">
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-card/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 border border-border flex items-center gap-2">
          <span className="text-[11px] font-bold text-foreground">{properties.length}</span>
          <span className="text-[10px] text-muted-foreground">imóveis no mapa</span>
        </div>
      </div>
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
