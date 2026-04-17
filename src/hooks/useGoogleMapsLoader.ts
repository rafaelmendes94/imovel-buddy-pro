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
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker,geocoding&loading=async&v=weekly`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Google Maps"));
        document.head.appendChild(script);
      });
    }

    loadPromise.then(() => setReady(true)).catch(console.error);
  }, [apiKey]);

  return { ready, loading: keyLoading || (!ready && !!apiKey) };
}
