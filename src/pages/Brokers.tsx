import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";
import { Plus, Mail, Phone, Award, Search, ExternalLink, Building2, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { SiteConfigDialog } from "@/components/SiteConfigDialog";

interface BrokerData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  creci: string | null;
  status: string;
  subscriber_id: string;
  imoveis_count: number;
  vgv: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const toSlug = (name: string) =>
  name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function Brokers() {
  const [search, setSearch] = useState("");
  const [brokers, setBrokers] = useState<BrokerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [appearanceFor, setAppearanceFor] = useState<{ slug: string; name: string } | null>(null);

  useEffect(() => {
    const fetchBrokers = async () => {
      const { data: brokersData } = await supabase
        .from("subscriber_brokers")
        .select("*")
        .order("name");

      if (!brokersData) { setLoading(false); return; }

      // Get property counts per broker
      const { data: imoveis } = await supabase
        .from("imoveis")
        .select("corretor_nome, preco, status");

      const brokerStats: Record<string, { count: number; vgv: number }> = {};
      (imoveis || []).forEach(i => {
        const name = i.corretor_nome || "";
        if (!brokerStats[name]) brokerStats[name] = { count: 0, vgv: 0 };
        brokerStats[name].count++;
        if (i.status === "Vendido") brokerStats[name].vgv += Number(i.preco || 0);
      });

      setBrokers(brokersData.map((b: any) => ({
        ...b,
        imoveis_count: brokerStats[b.name]?.count || 0,
        vgv: brokerStats[b.name]?.vgv || 0,
      })));
      setLoading(false);
    };
    fetchBrokers();
  }, []);

  const filtered = brokers.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <BackButton />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Corretores</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {brokers.length} corretores cadastrados
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-gold text-primary text-sm font-semibold hover:opacity-90 transition-opacity self-start">
            <Plus className="w-4 h-4" />
            Novo Corretor
          </button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar corretor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Carregando...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {filtered.map((broker) => (
              <div key={broker.id} className="elevated-card rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center text-sm font-bold text-primary">
                    {broker.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-card-foreground text-sm truncate">
                      {broker.name}
                    </h3>
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded",
                        broker.status === "active"
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {broker.status === "active" ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground">
                  {broker.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{broker.email}</span>
                    </div>
                  )}
                  {broker.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{broker.phone}</span>
                    </div>
                  )}
                  {broker.creci && (
                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5" />
                      <span>CRECI: {broker.creci}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Imóveis</p>
                    <p className="text-lg font-bold text-card-foreground">{broker.imoveis_count}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">VGV Vendido</p>
                    <p className="text-sm font-bold text-accent">{formatCurrency(broker.vgv)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAppearanceFor({ slug: toSlug(broker.name), name: broker.name })}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-accent/10 text-accent text-xs font-semibold hover:bg-accent/20 transition-colors"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    Aparência
                  </button>
                  <Link
                    to={`/corretor/${toSlug(broker.name)}`}
                    target="_blank"
                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver Página
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {appearanceFor && (
        <SiteConfigDialog
          open={!!appearanceFor}
          onOpenChange={(open) => !open && setAppearanceFor(null)}
          configType="broker_page"
          ownerId={appearanceFor.slug}
          showProfilePhoto
          title={`Aparência da página de ${appearanceFor.name}`}
        />
      )}
    </AppLayout>
  );
}
