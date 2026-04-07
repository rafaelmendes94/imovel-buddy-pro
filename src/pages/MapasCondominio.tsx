import { useState, useEffect } from "react";
import { Map, Download, Search, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Condominio {
  id: string;
  nome: string;
  imagem_url: string | null;
  endereco: string | null;
  cidade: string | null;
  mapa_pdf_url: string | null;
}

export default function MapasCondominio() {
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("condominios")
        .select("id, nome, imagem_url, endereco, cidade, mapa_pdf_url")
        .order("nome");
      setCondominios(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = condominios.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Map className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mapas dos Condomínios</h1>
            <p className="text-sm text-muted-foreground">Visualize e baixe os mapas de implantação dos condomínios</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar condomínio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">Nenhum condomínio encontrado.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c) => {
              const hasMapa = !!c.mapa_pdf_url?.trim();
              return (
                <Card key={c.id} className="overflow-hidden rounded-xl">
                  <div className="relative h-44 bg-muted flex items-center justify-center">
                    {c.imagem_url ? (
                      <img src={c.imagem_url} alt={c.nome} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-12 h-12 text-muted-foreground/40" />
                    )}
                    {!hasMapa && (
                      <Badge variant="secondary" className="absolute top-2 right-2">Sem mapa</Badge>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold text-foreground truncate">{c.nome}</h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {[c.endereco, c.cidade].filter(Boolean).join(" — ") || "Endereço não informado"}
                    </p>
                    <Button
                      size="sm"
                      className="w-full gap-2"
                      disabled={!hasMapa}
                      asChild={hasMapa}
                    >
                      {hasMapa ? (
                        <a href={c.mapa_pdf_url!} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" /> Baixar Mapa PDF
                        </a>
                      ) : (
                        <span><Download className="w-4 h-4" /> Baixar Mapa PDF</span>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
