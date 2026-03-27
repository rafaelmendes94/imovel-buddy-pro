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

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      properties.forEach((property) => {
        const marker = L.marker([property.lat, property.lng]).addTo(map);
        marker.bindPopup(`
          <div style="width:220px;font-family:system-ui,sans-serif;">
            <img src="${property.image}" alt="${property.title}" style="width:100%;height:100px;object-fit:cover;border-radius:6px;margin-bottom:8px;" />
            <h3 style="font-size:13px;font-weight:600;margin:0 0 4px 0;">${property.title}</h3>
            <p style="font-size:11px;color:#666;margin:0 0 4px 0;">📍 ${property.address}</p>
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
