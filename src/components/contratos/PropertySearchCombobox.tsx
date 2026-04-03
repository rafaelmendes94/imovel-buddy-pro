import { useState, useEffect, useRef } from "react";
import { Search, Building2, MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface PropertyResult {
  id: string;
  titulo: string;
  endereco: string;
  cidade: string;
  preco: number;
  proprietario: string | null;
  empreendimento: string | null;
  unidade: string | null;
  quartos: number;
  vagas: number;
  bairro: string | null;
  descricao: string | null;
}

interface PropertySearchComboboxProps {
  onSelect: (property: PropertyResult) => void;
}

export function PropertySearchCombobox({ onSelect }: PropertySearchComboboxProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PropertyResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<PropertyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (search.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("imoveis")
        .select("id, titulo, endereco, cidade, preco, proprietario, empreendimento, unidade, quartos, vagas, bairro, descricao")
        .or(`titulo.ilike.%${search}%,endereco.ilike.%${search}%,empreendimento.ilike.%${search}%`)
        .limit(8);
      setResults((data as PropertyResult[]) || []);
      setIsOpen(true);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (property: PropertyResult) => {
    setSelected(property);
    setSearch("");
    setIsOpen(false);
    onSelect(property);
  };

  const handleClear = () => {
    setSelected(null);
    setSearch("");
  };

  return (
    <div ref={wrapperRef} className="relative">
      {selected ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
          <Building2 className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{selected.titulo}</p>
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {selected.endereco}, {selected.cidade}
            </p>
          </div>
          <button onClick={handleClear} className="p-1 rounded hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar imóvel por título, endereço ou empreendimento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            className="pl-10 h-11"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg max-h-64 overflow-y-auto">
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelect(p)}
              className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
            >
              <p className="text-sm font-medium text-foreground truncate">{p.titulo}</p>
              <p className="text-xs text-muted-foreground truncate">
                {p.endereco}, {p.cidade} — R$ {p.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </button>
          ))}
        </div>
      )}

      {isOpen && search.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg p-4 text-center text-sm text-muted-foreground">
          Nenhum imóvel encontrado
        </div>
      )}
    </div>
  );
}
