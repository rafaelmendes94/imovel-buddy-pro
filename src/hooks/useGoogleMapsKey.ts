import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

let cachedKey: string | null = null;

export function useGoogleMapsKey() {
  const [apiKey, setApiKey] = useState<string | null>(cachedKey);
  const [loading, setLoading] = useState(!cachedKey);

  useEffect(() => {
    if (cachedKey) return;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("google-maps-key");
        if (!error && data?.key) {
          cachedKey = data.key;
          setApiKey(data.key);
        }
      } catch (e) {
        console.error("Failed to load Google Maps key", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { apiKey, loading };
}
