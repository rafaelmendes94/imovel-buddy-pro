export type MapPoint = { lat: number; lng: number };

export function hasValidCoordinates(lat: unknown, lng: unknown): boolean {
  const latitude = Number(lat);
  const longitude = Number(lng);
  return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180 && !(latitude === 0 && longitude === 0);
}

export function googleMapsRouteUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

export function formatMapPrice(price: number | null | undefined): string {
  const value = Number(price || 0);
  if (!value) return "Consulte";
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1).replace(".", ",")} mi`;
  if (value >= 1_000) return `R$ ${Math.round(value / 1_000)} mil`;
  return `R$ ${value}`;
}

export function mapMarkerSvg(label: string, selected = false): { svg: string; width: number; height: number } {
  const safeLabel = String(label).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] || char));
  const width = Math.max(68, Math.min(118, safeLabel.length * 7 + 26));
  const height = selected ? 44 : 40;
  const background = selected ? "#0f1b3d" : "#ffffff";
  const foreground = selected ? "#ffffff" : "#0f1b3d";
  const stroke = selected ? "#38a8ee" : "#d8dce6";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <g filter="url(#shadow)"><rect x="3" y="3" width="${width - 6}" height="27" rx="13.5" fill="${background}" stroke="${stroke}" stroke-width="${selected ? 2.5 : 1.2}"/><path d="M${width / 2 - 6} 29H${width / 2 + 6}L${width / 2} ${height - 2}Z" fill="${background}" stroke="${stroke}" stroke-width="1"/></g>
    <text x="${width / 2}" y="21" text-anchor="middle" font-family="system-ui,-apple-system,Arial" font-size="12" font-weight="700" fill="${foreground}">${safeLabel}</text>
    <defs><filter id="shadow" x="-20%" y="-20%" width="140%" height="180%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.6" flood-color="#0f1b3d" flood-opacity="0.25"/></filter></defs>
  </svg>`;
  return { svg, width, height };
}