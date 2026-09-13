export function useGoogleMapsKey() {
  const apiKey = (
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY
  ) as string | undefined;
  return { apiKey: apiKey || null, loading: false };
}
