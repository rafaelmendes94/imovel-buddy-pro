import { ExternalLink, MapPin, Navigation } from "lucide-react";
import { MiniMap } from "@/components/MiniMap";
import { Button } from "@/components/ui/button";
import { googleMapsRouteUrl, hasValidCoordinates } from "@/lib/mapUtils";

interface LocationMapCardProps {
  lat?: number | string | null;
  lng?: number | string | null;
  name: string;
  address?: string | null;
  height?: string;
  className?: string;
}

export function LocationMapCard({ lat, lng, name, address, height = "340px", className = "" }: LocationMapCardProps) {
  const valid = hasValidCoordinates(lat, lng);
  const latitude = Number(lat);
  const longitude = Number(lng);

  return (
    <div className={`overflow-hidden rounded-xl border border-border bg-card ${className}`}>
      {valid ? (
        <div className="grid md:grid-cols-[minmax(0,1fr)_300px]">
          <MiniMap lat={latitude} lng={longitude} name={name} height={height} />
          <div className="flex flex-col justify-center gap-4 border-t border-border p-4 md:border-l md:border-t-0 md:p-5">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                <MapPin className="h-4 w-4 text-primary" /> Localização exata
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{address || "Endereço não informado"}</p>
            </div>
            <Button asChild className="min-h-11 w-full gap-2">
              <a href={googleMapsRouteUrl(latitude, longitude)} target="_blank" rel="noopener noreferrer" aria-label={`Traçar rota para ${name}`}>
                <Navigation className="h-4 w-4" /> Traçar rota
              </a>
            </Button>
            <Button asChild variant="outline" className="min-h-11 w-full gap-2">
              <a href={`https://www.google.com/maps?q=${latitude},${longitude}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> Abrir no Google Maps
              </a>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex min-h-44 flex-col items-center justify-center px-6 py-10 text-center text-muted-foreground">
          <MapPin className="mb-3 h-10 w-10 opacity-40" />
          <p className="font-semibold text-foreground">Localização não cadastrada</p>
          <p className="mt-1 text-sm">Adicione latitude e longitude para exibir o mapa e traçar rotas.</p>
          {address && <p className="mt-3 text-xs">{address}</p>}
        </div>
      )}
    </div>
  );
}