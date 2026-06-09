import { useEffect, useRef } from "react";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMapsLoader";
import { Loader2 } from "lucide-react";

interface MiniMapProps {
  lat: number;
  lng: number;
  name: string;
  height?: string;
  zoom?: number;
}

export function MiniMap({ lat, lng, name, height = "250px", zoom = 15 }: MiniMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const { ready, loading } = useGoogleMapsLoader();

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const maps = (window as any).google?.maps;
    if (!maps) return;

    let cancelled = false;
    let markerInstance: any = null;

    (async () => {
      const MapCtor =
        maps.Map ||
        (typeof maps.importLibrary === "function"
          ? (await maps.importLibrary("maps")).Map
          : null);
      if (!MapCtor || cancelled || !mapRef.current) return;

      const markerLib =
        maps.marker ||
        (typeof maps.importLibrary === "function"
          ? await maps.importLibrary("marker").catch(() => null)
          : null);

      const map = new MapCtor(mapRef.current, {
        center: { lat, lng },
        zoom,
        mapTypeId: "hybrid",
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });
      mapInstanceRef.current = map;

      const AdvancedMarker = markerLib?.AdvancedMarkerElement;
      if (AdvancedMarker) {
        markerInstance = new AdvancedMarker({ position: { lat, lng }, map, title: name });
      } else {
        markerInstance = new maps.Marker({ position: { lat, lng }, map, title: name });
      }

      const infoWindow = new maps.InfoWindow({ content: `<b>${name}</b>` });
      infoWindow.open(map, markerInstance);
    })();

    return () => {
      cancelled = true;
      if (markerInstance) {
        if ("map" in markerInstance) markerInstance.map = null;
        else if (typeof markerInstance.setMap === "function") markerInstance.setMap(null);
      }
    };
  }, [ready, lat, lng, name, zoom]);

  if (loading) {
    return (
      <div className="rounded-xl overflow-hidden border border-border flex items-center justify-center bg-muted" style={{ height }}>
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-border" style={{ height }}>
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
