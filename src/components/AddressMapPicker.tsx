import { useEffect, useRef, useCallback } from "react";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMapsLoader";
import { Loader2 } from "lucide-react";

interface AddressMapPickerProps {
  latitude: string;
  longitude: string;
  onChange: (data: {
    cep?: string;
    endereco?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    latitude: string;
    longitude: string;
  }) => void;
}

const DEFAULT_CENTER = { lat: -29.75, lng: -50.05 };
const DEFAULT_ZOOM = 12;
const PIN_ZOOM = 16;

export function AddressMapPicker({ latitude, longitude, onChange }: AddressMapPickerProps) {
  const { ready, loading } = useGoogleMapsLoader();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const skipCenterRef = useRef(false);

  const getCenter = useCallback(() => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      return { lat, lng };
    }
    return DEFAULT_CENTER;
  }, [latitude, longitude]);

  const reverseGeocode = useCallback(async (latLng: google.maps.LatLng) => {
    if (!geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder();
    }
    try {
      const { results } = await geocoderRef.current.geocode({ location: latLng });
      if (!results?.[0]) return;

      const components = results[0].address_components;
      let endereco = "", bairro = "", cidade = "", estado = "", cep = "";

      for (const c of components) {
        if (c.types.includes("route")) endereco = c.long_name;
        if (c.types.includes("sublocality") || c.types.includes("sublocality_level_1")) bairro = c.long_name;
        if (c.types.includes("administrative_area_level_2")) cidade = c.long_name;
        if (c.types.includes("administrative_area_level_1")) estado = c.short_name;
        if (c.types.includes("postal_code")) cep = c.long_name.replace(/\D/g, "");
      }

      // Format CEP
      if (cep.length === 8) {
        cep = `${cep.slice(0, 5)}-${cep.slice(5)}`;
      }

      onChange({
        latitude: String(latLng.lat()),
        longitude: String(latLng.lng()),
        ...(endereco && { endereco }),
        ...(bairro && { bairro }),
        ...(cidade && { cidade }),
        ...(estado && { estado }),
        ...(cep && { cep }),
      });
    } catch {
      // Just update coordinates if geocoding fails
      onChange({
        latitude: String(latLng.lat()),
        longitude: String(latLng.lng()),
      });
    }
  }, [onChange]);

  // Initialize map
  useEffect(() => {
    if (!ready || !mapRef.current || mapInstanceRef.current) return;

    const center = getCenter();
    const zoom = center === DEFAULT_CENTER ? DEFAULT_ZOOM : PIN_ZOOM;

    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom,
      mapId: "address-picker",
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;

    // Add marker if we have coordinates
    if (center !== DEFAULT_CENTER) {
      markerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: center,
        gmpDraggable: true,
      });

      markerRef.current.addListener("dragend", () => {
        const pos = markerRef.current?.position;
        if (pos) {
          skipCenterRef.current = true;
          const latLng = new google.maps.LatLng(
            typeof pos.lat === "function" ? pos.lat() : pos.lat,
            typeof pos.lng === "function" ? pos.lng() : pos.lng
          );
          reverseGeocode(latLng);
        }
      });
    }

    // Click to place/move pin
    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      skipCenterRef.current = true;

      if (markerRef.current) {
        markerRef.current.position = e.latLng;
      } else {
        markerRef.current = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: e.latLng,
          gmpDraggable: true,
        });

        markerRef.current.addListener("dragend", () => {
          const pos = markerRef.current?.position;
          if (pos) {
            skipCenterRef.current = true;
            const latLng = new google.maps.LatLng(
              typeof pos.lat === "function" ? pos.lat() : pos.lat,
              typeof pos.lng === "function" ? pos.lng() : pos.lng
            );
            reverseGeocode(latLng);
          }
        });
      }

      reverseGeocode(e.latLng);
    });
  }, [ready]);

  // Update marker/center when coordinates change externally (e.g. CEP lookup)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (skipCenterRef.current) {
      skipCenterRef.current = false;
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

    const pos = { lat, lng };
    mapInstanceRef.current.panTo(pos);
    mapInstanceRef.current.setZoom(PIN_ZOOM);

    if (markerRef.current) {
      markerRef.current.position = pos;
    } else {
      markerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: pos,
        gmpDraggable: true,
      });

      markerRef.current.addListener("dragend", () => {
        const p = markerRef.current?.position;
        if (p) {
          skipCenterRef.current = true;
          const latLng = new google.maps.LatLng(
            typeof p.lat === "function" ? p.lat() : p.lat,
            typeof p.lng === "function" ? p.lng() : p.lng
          );
          reverseGeocode(latLng);
        }
      });
    }
  }, [latitude, longitude]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[250px] rounded-lg bg-muted/50 border border-border">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ready) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">📍 Clique no mapa para posicionar o pin e preencher o endereço automaticamente</p>
      <div ref={mapRef} className="w-full h-[250px] rounded-lg border border-border overflow-hidden" />
    </div>
  );
}
