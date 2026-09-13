import { useCallback, useEffect, useState } from "react";

const BROWSER_KEY = (
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY
) as string | undefined;
const TRACKING_ID = (
  import.meta.env.VITE_GOOGLE_MAPS_TRACKING_ID
) as string | undefined;
const LOAD_TIMEOUT_MS = 15000;

declare global {
  interface Window {
    __mvGoogleMapsCallback?: () => void;
    __mvGoogleMapsReady?: boolean;
    __mvGoogleMapsPromise?: Promise<void>;
    gm_authFailure?: () => void;
  }
}

const AUTH_ERROR =
  "O mapa foi bloqueado pelo Google para este endereço (chave restrita por domínio). Abra o site publicado ou libere este domínio na chave do Google Maps.";
const GENERIC_ERROR = "Não foi possível carregar o mapa. Verifique sua conexão e tente novamente.";

let authFailed = false;
const authListeners = new Set<() => void>();

function subscribeAuthFailure(listener: () => void): () => void {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

if (typeof window !== "undefined") {
  // Google chama gm_authFailure quando a chave/domínio é rejeitado — pode ocorrer
  // depois do script carregar, por isso o aviso é global e não só durante o load.
  window.gm_authFailure = () => {
    authFailed = true;
    window.__mvGoogleMapsReady = false;
    authListeners.forEach((listener) => listener());
  };
}

function ensureGoogleMapsLoaded(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.__mvGoogleMapsReady && (window as any).google?.maps?.Map) {
    return Promise.resolve();
  }
  if (window.__mvGoogleMapsPromise) return window.__mvGoogleMapsPromise;

  if (!BROWSER_KEY) {
    return Promise.reject(new Error(AUTH_ERROR));
  }

  const promise = new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (err) {
        window.__mvGoogleMapsPromise = undefined;
        reject(err);
      } else {
        resolve();
      }
    };

    const timer = setTimeout(
      () => finish(new Error(authFailed ? AUTH_ERROR : GENERIC_ERROR)),
      LOAD_TIMEOUT_MS
    );

    const unsubscribe = subscribeAuthFailure(() => {
      unsubscribe();
      finish(new Error(AUTH_ERROR));
    });


    window.__mvGoogleMapsCallback = async () => {
      try {
        const g = (window as any).google;
        if (g?.maps?.importLibrary) {
          await Promise.all([
            g.maps.importLibrary("maps"),
            g.maps.importLibrary("marker").catch(() => null),
            g.maps.importLibrary("geocoding").catch(() => null),
          ]);
        }
        if (!(window as any).google?.maps?.Map) {
          finish(new Error(GENERIC_ERROR));
          return;
        }
        window.__mvGoogleMapsReady = true;
        finish();
      } catch (e) {
        finish(e instanceof Error ? e : new Error(GENERIC_ERROR));
      }
    };

    const existing = document.querySelector('script[data-google-maps-loader]') as HTMLScriptElement | null;
    if (existing) {
      // Script já presente: se a API já estiver disponível, resolve; senão o callback/timeout decide.
      if ((window as any).google?.maps?.Map) {
        window.__mvGoogleMapsReady = true;
        finish();
      }
      return;
    }

    const channelParam = TRACKING_ID ? `&channel=${TRACKING_ID}` : "";
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${BROWSER_KEY}&loading=async&callback=__mvGoogleMapsCallback${channelParam}`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsLoader = "true";
    script.onerror = () => {
      script.remove();
      finish(new Error(GENERIC_ERROR));
    };
    document.head.appendChild(script);
  });

  window.__mvGoogleMapsPromise = promise;
  return promise;
}

export function useGoogleMapsLoader() {
  const [ready, setReady] = useState<boolean>(() => !!window.__mvGoogleMapsReady && !authFailed);
  const [loading, setLoading] = useState<boolean>(() => !window.__mvGoogleMapsReady && !authFailed);
  const [error, setError] = useState<string | null>(() => (authFailed ? AUTH_ERROR : null));
  const [attempt, setAttempt] = useState(0);

  useEffect(() =>
    subscribeAuthFailure(() => {
      setReady(false);
      setLoading(false);
      setError(AUTH_ERROR);
    }),
  []);

  useEffect(() => {
    let cancelled = false;
    if (authFailed) {
      setError(AUTH_ERROR);
      setLoading(false);
      return;
    }
    setError(null);
    if (!window.__mvGoogleMapsReady) setLoading(true);
    ensureGoogleMapsLoaded()
      .then(() => {
        if (!cancelled) {
          setReady(true);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        console.error("[GoogleMaps] load error", err);
        if (!cancelled) {
          setLoading(false);
          setError(err?.message || GENERIC_ERROR);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    if (!window.__mvGoogleMapsReady) {
      window.__mvGoogleMapsPromise = undefined;
      document.querySelectorAll('script[data-google-maps-loader]').forEach((node) => node.remove());
      authFailed = false;
    }
    setAttempt((value) => value + 1);
  }, []);

  return { ready, loading, error, retry };
}
