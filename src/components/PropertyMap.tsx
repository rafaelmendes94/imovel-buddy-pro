import { useEffect, useRef } from "react";
import { Property, formatCurrency } from "@/data/mockData";
import { MapPin, BedDouble, Ruler } from "lucide-react";

interface PropertyMapProps {
  properties: Property[];
}

export function PropertyMap({ properties }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamically load Leaflet CSS and JS
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

        const statusColor = property.status === "Vendido" ? "#ef4444"
          : property.status === "Reservado" ? "#f59e0b"
          : property.status === "Alugado" ? "#3b82f6"
          : "#10b981";

        const icon = L.divIcon({
          className: "",
          html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
            <div style="background:${cfg.bg};border:2px solid ${cfg.color};border-radius:12px 12px 12px 0;padding:4px 6px;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;gap:3px;white-space:nowrap;">
              <span style="font-size:16px;line-height:1;">${cfg.emoji}</span>
              <span style="font-size:10px;font-weight:700;color:${cfg.color};">${property.type === "Apartamento" ? "Apto" : property.type}</span>
              <span style="width:6px;height:6px;border-radius:50%;background:${statusColor};flex-shrink:0;"></span>
            </div>
            <div style="width:2px;height:6px;background:${cfg.color};"></div>
            <div style="width:6px;height:6px;background:${cfg.color};border-radius:50%;"></div>
          </div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const marker = L.marker([property.lat, property.lng], { icon }).addTo(map);
        marker.bindPopup(`
          <div style="width:220px;font-family:system-ui,sans-serif;">
            <img src="${property.image}" alt="${property.title}" style="width:100%;height:100px;object-fit:cover;border-radius:6px;margin-bottom:8px;" />
            <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
              <span style="font-size:14px;">${cfg.emoji}</span>
              <span style="font-size:10px;font-weight:700;color:${cfg.color};background:${cfg.bg};padding:1px 6px;border-radius:4px;">${property.type}</span>
              <span style="font-size:10px;font-weight:600;color:${statusColor};">${property.status}</span>
            </div>
            <h3 style="font-size:13px;font-weight:600;margin:0 0 4px 0;">${property.title}</h3>
            <p style="font-size:11px;color:#666;margin:0 0 4px 0;">📍 ${property.address}, ${property.city}</p>
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
      }
    };
  }, [properties]);

  return (
    <div className="elevated-card rounded-xl overflow-hidden" style={{ height: "600px" }}>
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
