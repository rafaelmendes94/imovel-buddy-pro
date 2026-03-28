import { useEffect, useRef, useState } from "react";
import { Property, formatCurrency } from "@/data/mockData";

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

      const map = L.map(mapRef.current).setView(center, 11);
      mapInstanceRef.current = map;

      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: '&copy; Esri, Maxar, Earthstar Geographics',
        maxZoom: 19,
      }).addTo(map);

      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19,
      }).addTo(map);

      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19,
      }).addTo(map);

      const typeConfig: Record<string, { emoji: string; color: string; bg: string }> = {
        Apartamento: { emoji: "🏢", color: "#3b82f6", bg: "#dbeafe" },
        Casa: { emoji: "🏠", color: "#10b981", bg: "#d1fae5" },
        Comercial: { emoji: "🏪", color: "#f59e0b", bg: "#fef3c7" },
        Terreno: { emoji: "🌳", color: "#8b5cf6", bg: "#ede9fe" },
      };

      properties.forEach((property) => {
        const cfg = typeConfig[property.type] || typeConfig.Apartamento;
        const shortPrice = formatShortPrice(property.price);

        const icon = L.divIcon({
          className: "",
          html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
            <div style="background:${cfg.bg};border:2px solid ${cfg.color};border-radius:10px 10px 10px 0;padding:3px 5px;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;gap:3px;white-space:nowrap;">
              <span style="font-size:14px;line-height:1;">${cfg.emoji}</span>
              <span style="font-size:9px;font-weight:800;color:${cfg.color};">${shortPrice}</span>
            </div>
            <div style="width:2px;height:5px;background:${cfg.color};"></div>
            <div style="width:5px;height:5px;background:${cfg.color};border-radius:50%;"></div>
          </div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const marker = L.marker([property.lat, property.lng], { icon }).addTo(map);
        (marker as any)._propertyData = property;
        markersRef.current.push(marker);

        marker.bindPopup(`
          <div style="width:230px;font-family:system-ui,sans-serif;">
            <img src="${property.image}" alt="${property.title}" style="width:100%;height:100px;object-fit:cover;border-radius:6px;margin-bottom:8px;" />
            <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
              <span style="font-size:14px;">${cfg.emoji}</span>
              <span style="font-size:10px;font-weight:700;color:${cfg.color};background:${cfg.bg};padding:1px 6px;border-radius:4px;">${property.type}</span>
              <span style="font-size:10px;font-weight:600;color:#888;">${property.status}</span>
            </div>
            <h3 style="font-size:13px;font-weight:600;margin:0 0 4px 0;">${property.title}</h3>
            <p style="font-size:11px;color:#666;margin:0 0 4px 0;">📍 ${property.address}${property.neighborhood ? `, ${property.neighborhood}` : ""} - ${property.city}</p>
            <p style="font-size:14px;font-weight:700;color:#d97706;margin:0 0 4px 0;">${formatCurrency(property.price)}</p>
            <p style="font-size:11px;color:#888;margin:0;">
              ${property.bedrooms > 0 ? `🛏 ${property.bedrooms}` : ""} 
              📐 ${property.area}m²
            </p>
          </div>
        `);
      });
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
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.1,
        weight: 2,
        dashArray: "6 4",
      }).addTo(map);

      let count = 0;
      markersRef.current.forEach((marker) => {
        const p = (marker as any)._propertyData as Property;
        const dist = getDistance(lat, lng, p.lat, p.lng);
        const el = marker.getElement?.();
        if (dist <= nearbyRadius) {
          count++;
          if (el) el.style.opacity = "1";
        } else {
          if (el) el.style.opacity = "0.25";
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
      if (el) el.style.opacity = "1";
    });
  };

  return (
    <div className="elevated-card rounded-xl overflow-hidden relative" style={{ height: "600px" }}>
      {/* Nearby controls */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => nearbyMode ? clearNearby() : setNearbyMode(true)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold shadow-lg transition-all ${
            nearbyMode
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-800 hover:bg-gray-100"
          }`}
        >
          📍 {nearbyMode ? "Sair modo próximos" : "Imóveis próximos"}
        </button>

        {nearbyMode && (
          <div className="bg-white rounded-lg shadow-lg p-3 space-y-2 min-w-[180px]">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Raio de busca</p>
            <div className="flex gap-1">
              {[1, 2, 5, 10].map((r) => (
                <button
                  key={r}
                  onClick={() => setNearbyRadius(r)}
                  className={`flex-1 px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                    nearbyRadius === r
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {r}km
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-500 text-center">
              {nearbyCenter
                ? `${nearbyCount} imóvel(is) em ${nearbyRadius}km`
                : "Clique no mapa para buscar"}
            </p>
          </div>
        )}
      </div>

      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
