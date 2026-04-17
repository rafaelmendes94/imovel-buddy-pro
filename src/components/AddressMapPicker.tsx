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

function getGoogleMaps() {
  return (window as any).google?.maps;
}

function getMarkerPosition(marker: any) {
  if (!marker) return null;
  if (marker.position) return marker.position;
  if (typeof marker.getPosition === "function") return marker.getPosition();
  return null;
}

function setMarkerPosition(marker: any, position: any) {
  if (!marker) return;
  if ("position" in marker) {
    marker.position = position;
    return;
  }
  if (typeof marker.setPosition === "function") {
    marker.setPosition(position);
  }
}

function removeMarker(marker: any) {
  if (!marker) return;
  if ("map" in marker) {
    marker.map = null;
    return;
  }
  if (typeof marker.setMap === "function") {
    marker.setMap(null);
  }
}

function createDraggableMarker(maps: any, map: any, position: any) {
  const AdvancedMarkerElement = maps.marker?.AdvancedMarkerElement;

  if (AdvancedMarkerElement) {
    return new AdvancedMarkerElement({
      map,
      position,
      gmpDraggable: true,
    });
  }

  return new maps.Marker({
    map,
    position,
    draggable: true,
  });
}

export function AddressMapPicker({ latitude, longitude, onChange }: AddressMapPickerProps) {
  const { ready, loading } = useGoogleMapsLoader();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const skipCenterRef = useRef(false);

  const getCenter = useCallback(() => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      return { lat, lng };
    }
    return DEFAULT_CENTER;
  }, [latitude, longitude]);

  const reverseGeocode = useCallback(async (latLng: any) => {
    const maps = getGoogleMaps();
    if (!maps) return;

    if (!geocoderRef.current) {
      geocoderRef.current = new maps.Geocoder();
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

      if (cep.length === 8) {
        cep = `${cep.slice(0, 5)}-${cep.slice(5)}`;
      }

      const latVal = typeof latLng.lat === "function" ? latLng.lat() : latLng.lat;
      const lngVal = typeof latLng.lng === "function" ? latLng.lng() : latLng.lng;

      onChange({
        latitude: String(latVal),
        longitude: String(lngVal),
        ...(endereco && { endereco }),
        ...(bairro && { bairro }),
        ...(cidade && { cidade }),
        ...(estado && { estado }),
        ...(cep && { cep }),
      });
    } catch {
      const latVal = typeof latLng.lat === "function" ? latLng.lat() : latLng.lat;
      const lngVal = typeof latLng.lng === "function" ? latLng.lng() : latLng.lng;
      onChange({ latitude: String(latVal), longitude: String(lngVal) });
    }
  }, [onChange]);

  const addDragListener = useCallback((marker: any) => {
    marker.addListener("dragend", () => {
      const pos = getMarkerPosition(marker);
      if (pos) {
        skipCenterRef.current = true;
        reverseGeocode(pos);
      }
    });
  }, [reverseGeocode]);

  useEffect(() => {
    const maps = getGoogleMaps();
    if (!ready || !maps || !mapRef.current || mapInstanceRef.current) return;

    const center = getCenter();
    const zoom = center === DEFAULT_CENTER ? DEFAULT_ZOOM : PIN_ZOOM;

    const map = new maps.Map(mapRef.current, {
      center,
      zoom,
      mapId: "address-picker",
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;

    if (center !== DEFAULT_CENTER) {
      markerRef.current = createDraggableMarker(maps, map, center);
      addDragListener(markerRef.current);
    }

    const clickListener = map.addListener("click", (e: any) => {
      if (!e.latLng) return;
      skipCenterRef.current = true;

      if (markerRef.current) {
        setMarkerPosition(markerRef.current, e.latLng);
      } else {
        markerRef.current = createDraggableMarker(maps, map, e.latLng);
        addDragListener(markerRef.current);
      }

      reverseGeocode(e.latLng);
    });

    return () => {
      clickListener?.remove?.();
      removeMarker(markerRef.current);
      markerRef.current = null;
      mapInstanceRef.current = null;
    };
  }, [ready, getCenter, addDragListener, reverseGeocode]);

  useEffect(() => {
    const maps = getGoogleMaps();
    if (!mapInstanceRef.current || !maps) return;
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
      setMarkerPosition(markerRef.current, pos);
    } else {
      markerRef.current = createDraggableMarker(maps, mapInstanceRef.current, pos);
      addDragListener(markerRef.current);
    }
  }, [latitude, longitude, addDragListener]);

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
