import { useEffect, useState } from "react";
import { useGoogleMapsKey } from "./useGoogleMapsKey";

let loadPromise: Promise<void> | null = null;

export function useGoogleMapsLoader() {
  const { apiKey, loading: keyLoading } = useGoogleMapsKey();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!apiKey) return;

    if ((window as any).google?.maps) {
      setReady(true);
      return;
    }

    if (!loadPromise) {
      loadPromise = new Promise<void>((resolve, reject) => {
        const existing = document.querySelector('script[data-google-maps-loader]') as HTMLScriptElement | null;
        const onReady = async () => {
          try {
            const g = (window as any).google;
            if (!g?.maps) {
              throw new Error("Google Maps indisponível");
            }
            if (typeof g.maps.importLibrary === "function") {
              await Promise.all([
                g.maps.importLibrary("maps"),
                g.maps.importLibrary("marker"),
                g.maps.importLibrary("geocoding"),
              ]);
            }
            resolve();
          } catch (e) {
            reject(e as Error);
          }
        };
        if (existing) {
          if ((window as any).google?.maps) onReady();
          else existing.addEventListener("load", onReady, { once: true });
          return;
        }
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&v=weekly`;
        script.async = true;
        script.defer = true;
        script.dataset.googleMapsLoader = "true";
        script.onload = onReady;
        script.onerror = () => reject(new Error("Failed to load Google Maps"));
        document.head.appendChild(script);
      });
    }

    loadPromise.then(() => setReady(true)).catch(console.error);
  }, [apiKey]);

  return { ready, loading: keyLoading || (!ready && !!apiKey) };
}
