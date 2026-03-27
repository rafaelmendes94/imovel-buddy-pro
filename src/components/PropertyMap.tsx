import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Property, formatCurrency } from "@/data/mockData";
import { MapPin, BedDouble, Ruler } from "lucide-react";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface PropertyMapProps {
  properties: Property[];
}

export function PropertyMap({ properties }: PropertyMapProps) {
  const center: [number, number] = properties.length > 0
    ? [properties[0].lat, properties[0].lng]
    : [-23.55, -46.63];

  return (
    <div className="elevated-card rounded-xl overflow-hidden" style={{ height: "600px" }}>
      <MapContainer
        center={center}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {properties.map((property) => (
          <Marker key={property.id} position={[property.lat, property.lng]}>
            <Popup>
              <div className="w-56">
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-28 object-cover rounded-md mb-2"
                />
                <h3 className="font-semibold text-sm mb-1">{property.title}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                  <MapPin className="w-3 h-3" /> {property.address}
                </p>
                <p className="text-sm font-bold text-amber-600 mb-1">
                  {formatCurrency(property.price)}
                </p>
                <div className="flex gap-3 text-xs text-gray-500">
                  {property.bedrooms > 0 && (
                    <span className="flex items-center gap-1">
                      <BedDouble className="w-3 h-3" /> {property.bedrooms}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Ruler className="w-3 h-3" /> {property.area}m²
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
