import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2 } from "lucide-react";
import { AddressMapPicker } from "./AddressMapPicker";

export interface AddressData {
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  latitude: string;
  longitude: string;
}

interface CepAutoFillProps {
  data: AddressData;
  onChange: (data: Partial<AddressData>) => void;
}

export function CepAutoFill({ data, onChange }: CepAutoFillProps) {
  const [loadingCep, setLoadingCep] = useState(false);

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return digits;
  };

  const fetchCep = async (cep: string) => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const json = await res.json();
      if (json.erro) return;

      const updates: Partial<AddressData> = {
        endereco: json.logradouro || "",
        bairro: json.bairro || "",
        cidade: json.localidade || "",
        estado: json.uf || "",
      };

      // Buscar coordenadas via Nominatim
      try {
        const geoQuery = `${json.logradouro || ""}, ${json.localidade || ""}, ${json.uf || ""}, Brazil`;
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(geoQuery)}&limit=1`
        );
        const geoData = await geoRes.json();
        if (geoData.length > 0) {
          updates.latitude = geoData[0].lat;
          updates.longitude = geoData[0].lon;
        }
      } catch {}

      onChange(updates);
    } catch {
      // silently fail
    } finally {
      setLoadingCep(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> CEP
            {loadingCep && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
          </Label>
          <Input
            placeholder="00000-000"
            value={data.cep}
            onChange={(e) => onChange({ cep: formatCep(e.target.value) })}
            onBlur={() => fetchCep(data.cep)}
            maxLength={9}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs">Logradouro</Label>
          <Input
            placeholder="Rua, Av..."
            value={data.endereco}
            onChange={(e) => onChange({ endereco: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Número</Label>
          <Input
            placeholder="Nº"
            value={data.numero}
            onChange={(e) => onChange({ numero: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Complemento</Label>
          <Input
            placeholder="Apto, Bloco..."
            value={data.complemento}
            onChange={(e) => onChange({ complemento: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Bairro</Label>
          <Input
            placeholder="Bairro"
            value={data.bairro}
            onChange={(e) => onChange({ bairro: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Cidade</Label>
          <Input
            placeholder="Cidade"
            value={data.cidade}
            onChange={(e) => onChange({ cidade: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">UF</Label>
          <Input
            placeholder="UF"
            value={data.estado}
            maxLength={2}
            onChange={(e) => onChange({ estado: e.target.value.toUpperCase() })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Latitude</Label>
          <Input
            type="number"
            step="any"
            placeholder="-29.3456"
            value={data.latitude}
            onChange={(e) => onChange({ latitude: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Longitude</Label>
          <Input
            type="number"
            step="any"
            placeholder="-50.1234"
            value={data.longitude}
            onChange={(e) => onChange({ longitude: e.target.value })}
          />
        </div>
      </div>

      {/* Mapa interativo para seleção por pin */}
      <AddressMapPicker
        latitude={data.latitude}
        longitude={data.longitude}
        onChange={onChange}
      />
    </div>
  );
}
