import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  Car,
  DollarSign,
  Filter,
  Home,
  Mail,
  MapPin,
  Paintbrush,
  Phone,
  Ruler,
  Search,
  Star,
  TrendingUp,
  TreePine,
  Waves,
  X,
} from "lucide-react";
import { cn, toSlug } from "@/lib/utils";
import { BrokerRatings } from "@/components/BrokerRatings";

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const normalizePhone = (value?: string | null) => (value || "").replace(/\D/g, "");
const getAvatarFallback = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f4c81&color=fff&size=256`;

interface BrokerRecord {
  name: string;
  phone: string | null;
  creci: string | null;
  email: string | null;
}

interface BrokerPageConfig {
  site_title: string;
  slogan: string;
  cover_photo_url: string | null;
  profile_photo_url: string | null;
  logo_url: string | null;
  whatsapp: string | null;
  footer_text: string | null;
  email_contact: string | null;
  bio: string | null;
}

interface DBProperty {
  id: string;
  user_id: string;
  titulo: string;
  endereco: string;
  cidade: string;
  tipo: string;
  status: string;
  preco: number;
  area: number;
  quartos: number;
  banheiros: number;
  vagas: number;
  comissao: number | null;
  imagens: string[] | null;
  vista_mar: boolean;
  decorado: boolean;
  aceita_permuta: boolean;
  condicoes_pagamento: string[] | null;
  empreendimento: string | null;
  unidade: string | null;
  box: string | null;
  quadra: string | null;
  lote: string | null;
  bairro: string | null;
  corretor_nome: string | null;
}

function PropertyCard({ p, brokerName, whatsapp }: { p: DBProperty; brokerName: string; whatsapp: string }) {
  const img = p.imagens?.[0] || "/placeholder.svg";
  const msg = encodeURIComponent(`Olá ${brokerName}! Tenho interesse no imóvel: ${p.titulo} - ${formatCurrency(p.preco)}`);
  const statusClass = p.status === "Vendido"
    ? "bg-destructive text-destructive-foreground"
    : p.status === "Reservado"
      ? "bg-warning text-warning-foreground"
      : "bg-success text-success-foreground";

  return (
    <article className="group overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]">
      <div className="relative h-60 overflow-hidden">
        <img src={img} alt={p.titulo} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
        <span className={cn("absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide", statusClass)}>{p.status}</span>
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <p className="text-2xl font-black text-white drop-shadow-lg">{formatCurrency(p.preco)}</p>
          <div className="flex flex-wrap justify-end gap-2">
            {p.vista_mar && <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-[10px] font-bold text-accent-foreground"><Waves className="h-3 w-3" /> Vista mar</span>}
            {p.decorado && <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground"><Paintbrush className="h-3 w-3" /> Decorado</span>}
          </div>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-card-foreground">{p.titulo}</h3>
        {(p.empreendimento || p.unidade || p.quadra) && (
          <div className="flex flex-wrap items-center gap-2">
            {p.empreendimento && <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{p.empreendimento}</span>}
            {p.unidade && <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{p.unidade}</span>}
            {p.quadra && <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{p.quadra}</span>}
            {p.lote && <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{p.lote}</span>}
          </div>
        )}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /><span>{p.endereco}, {p.cidade}</span></div>
        </div>
        {(p.quartos > 0 || p.area > 0) && (
          <div className="flex flex-wrap items-center gap-4 border-y border-border py-3 text-sm text-muted-foreground">
            {p.area > 0 && <span className="flex items-center gap-1"><Ruler className="h-4 w-4" />{p.area}m²</span>}
            {p.quartos > 0 && <span className="flex items-center gap-1"><BedDouble className="h-4 w-4" />{p.quartos}</span>}
            {p.banheiros > 0 && <span className="flex items-center gap-1"><Bath className="h-4 w-4" />{p.banheiros}</span>}
            {p.vagas > 0 && <span className="flex items-center gap-1"><Car className="h-4 w-4" />{p.vagas}</span>}
          </div>
        )}
        {p.condicoes_pagamento && p.condicoes_pagamento.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {p.condicoes_pagamento.map((c) => <span key={`${p.id}-${c}`} className="rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-bold text-success">{c}</span>)}
          </div>
        )}
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp}?text=${msg}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90">
            <Phone className="h-4 w-4" /> Tenho interesse
          </a>
        )}
      </div>
    </article>
  );
}

export default function BrokerSite() {
  const { slug } = useParams<{ slug: string }>();

  const [brokerName, setBrokerName] = useState("");
  const [properties, setProperties] = useState<DBProperty[]>([]);
  const [soldProperties, setSoldProperties] = useState<DBProperty[]>([]);
  const [brokerRecord, setBrokerRecord] = useState<BrokerRecord | null>(null);
  const [config, setConfig] = useState<BrokerPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [brokerId, setBrokerId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!slug) { setLoading(false); return; }

      setLoading(true);

      const [{ data: brokersData }, { data: propertiesData }, { data: pageConfig }] = await Promise.all([
        supabase
          .from("subscriber_brokers")
          .select("name, phone, creci, email")
          .eq("status", "active"),
        supabase
          .from("imoveis")
          .select("id, user_id, titulo, endereco, cidade, tipo, status, preco, area, quartos, banheiros, vagas, comissao, imagens, vista_mar, decorado, aceita_permuta, condicoes_pagamento, empreendimento, unidade, box, quadra, lote, bairro, corretor_nome")
          .eq("ativo_site", true),
        supabase
          .from("site_config")
          .select("site_title, slogan, cover_photo_url, profile_photo_url, logo_url, whatsapp, footer_text, email_contact, bio")
          .eq("config_type", "broker_page")
          .eq("owner_id", slug)
          .maybeSingle(),
      ]);

      const matchedBroker = ((brokersData as BrokerRecord[] | null) || []).find((broker) => toSlug(broker.name) === slug) || null;
      const matchedProperties = ((propertiesData as DBProperty[] | null) || [])
        .filter((property) => toSlug(property.corretor_nome || "") === slug)
        .sort((a, b) => Number(b.preco) - Number(a.preco));

      const resolvedName = matchedBroker?.name || matchedProperties[0]?.corretor_nome || (slug ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "");

      setBrokerName(resolvedName);
      setBrokerRecord(matchedBroker);
      setConfig((pageConfig as BrokerPageConfig | null) || null);
      setBrokerId(matchedProperties[0]?.user_id || null);
      setProperties(matchedProperties.filter((property) => property.status !== "Vendido"));
      setSoldProperties(matchedProperties.filter((property) => property.status === "Vendido"));
      setLoading(false);
    };

    load();
  }, [slug]);

  const filteredProperties = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return properties.filter((property) => {
      if (tipoFilter && property.tipo !== tipoFilter) return false;
      if (statusFilter && property.status !== statusFilter) return false;
      if (!term) return true;
      return (
        property.titulo.toLowerCase().includes(term) ||
        property.endereco.toLowerCase().includes(term) ||
        property.cidade.toLowerCase().includes(term) ||
        (property.bairro || "").toLowerCase().includes(term)
      );
    });
  }, [properties, searchTerm, tipoFilter, statusFilter]);

  const propertiesByCity = useMemo(() => {
    const grouped = filteredProperties.reduce<Record<string, DBProperty[]>>((acc, property) => {
      const city = property.cidade || "Outras regiões";
      if (!acc[city]) acc[city] = [];
      acc[city].push(property);
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([cityA], [cityB]) => cityA.localeCompare(cityB, "pt-BR"))
      .map(([city, items]) => ({ city, items }));
  }, [filteredProperties]);

  const featuredProperties = useMemo(() => properties.slice(0, 3), [properties]);
  const apartments = useMemo(() => properties.filter((property) => property.tipo === "Apartamento").length, [properties]);
  const houses = useMemo(() => properties.filter((property) => property.tipo === "Casa").length, [properties]);
  const lots = useMemo(() => properties.filter((property) => property.tipo === "Terreno" || property.tipo === "Lote").length, [properties]);
  const totalValue = useMemo(() => properties.reduce((sum, property) => sum + Number(property.preco), 0), [properties]);
  const soldValue = useMemo(() => soldProperties.reduce((sum, property) => sum + Number(property.preco), 0), [soldProperties]);
  const ticketMedio = useMemo(() => (properties.length > 0 ? totalValue / properties.length : 0), [properties, totalValue]);
  const totalComissao = useMemo(
    () => properties.reduce((sum, p) => sum + (Number(p.preco) * (Number(p.comissao) || 0)) / 100, 0),
    [properties],
  );
  const tipos = useMemo(() => Array.from(new Set(properties.map((p) => p.tipo).filter(Boolean))), [properties]);
  const statusList = useMemo(() => Array.from(new Set(properties.map((p) => p.status).filter(Boolean))), [properties]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!brokerName) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="space-y-4 text-center">
          <p className="text-lg font-semibold text-foreground">Corretor não encontrado</p>
          <Link to="/site" className="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2.5 font-semibold text-accent-foreground transition-opacity hover:opacity-90">
            <ArrowLeft className="h-4 w-4" /> Voltar ao site
          </Link>
        </div>
      </div>
    );
  }

  const whatsapp = normalizePhone(config?.whatsapp || brokerRecord?.phone || "");
  const email = config?.email_contact || brokerRecord?.email || "";
  const creci = brokerRecord?.creci || "";
  const avatarUrl = config?.profile_photo_url || getAvatarFallback(brokerName);
  const coverUrl = config?.cover_photo_url;
  const eyebrow = config?.site_title || "Portfólio do corretor";
  const slogan = config?.slogan || "Confira os imóveis disponíveis e o histórico de vendas deste corretor.";
  const whatsappGeneral = encodeURIComponent(`Olá ${brokerName}! Vi sua página pública e gostaria de mais informações.`);
  const totalPortfolio = properties.length + soldProperties.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/site" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar ao site
          </Link>
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp}?text=${whatsappGeneral}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90">
              <Phone className="h-4 w-4" /> Falar agora
            </a>
          )}
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border">
          {coverUrl ? (
            <img src={coverUrl} alt={`Capa de ${brokerName}`} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 gradient-navy" aria-hidden />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-foreground/90 via-foreground/75 to-primary/70" aria-hidden />

          <div className="container relative py-16 md:py-24">
            <div className="grid gap-8 lg:grid-cols-[220px,1fr] lg:items-end">
              <div className="mx-auto lg:mx-0">
                <div className="relative">
                  <img src={avatarUrl} alt={brokerName} className="h-40 w-40 rounded-full border-4 border-background/80 object-cover shadow-2xl md:h-52 md:w-52" />
                  <span className="absolute bottom-3 right-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-xl">
                    <Star className="h-5 w-5" />
                  </span>
                </div>
              </div>

              <div className="space-y-6 text-center lg:text-left">
                <div className="space-y-4">
                  <p className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
                    {eyebrow}
                  </p>
                  <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">{brokerName}</h1>
                  <p className="max-w-3xl text-base text-white/80 md:text-xl">{slogan}</p>
                  <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-white/75 lg:justify-start">
                    {creci && <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white/85">CRECI {creci}</span>}
                    {email && (
                      <a href={`mailto:${email}`} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 transition-colors hover:bg-white/15 hover:text-white">
                        <Mail className="h-4 w-4" /> {email}
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
                  {whatsapp && (
                    <a href={`https://wa.me/${whatsapp}?text=${whatsappGeneral}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90">
                      <Phone className="h-4 w-4" /> Chamar no WhatsApp
                    </a>
                  )}
                  <Link to="/site" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/15">
                    <Building2 className="h-4 w-4" /> Ver vitrine completa
                  </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                  {[
                    { label: "Imóveis em carteira", value: properties.length, icon: Building2 },
                    { label: "VGV em carteira", value: formatCurrency(totalValue), icon: DollarSign },
                    { label: "Ticket médio", value: formatCurrency(ticketMedio), icon: TrendingUp },
                    { label: "Comissão estimada", value: formatCurrency(totalComissao), icon: Star },
                    { label: "Vendas públicas", value: soldProperties.length, icon: Home },
                    { label: "VGV vendido", value: formatCurrency(soldValue), icon: DollarSign },
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
                        <metric.icon className="h-5 w-5" />
                      </div>
                      <p className="text-xl font-black text-white">{metric.value}</p>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-8">
          <div className="grid gap-4 lg:grid-cols-[1fr,auto] lg:items-center">
            <div className="flex items-center rounded-3xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
              <Search className="ml-3 h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar imóvel por título, endereço, bairro ou cidade"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="rounded-2xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Limpar busca">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-sm font-medium text-muted-foreground"><Building2 className="h-4 w-4" /> {apartments} apartamentos</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-sm font-medium text-muted-foreground"><Home className="h-4 w-4" /> {houses} casas</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-sm font-medium text-muted-foreground"><TreePine className="h-4 w-4" /> {lots} terrenos</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Filter className="h-3 w-3" /> Filtros:
            </span>
            <button
              onClick={() => setTipoFilter("")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                !tipoFilter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              Todos os tipos
            </button>
            {tipos.map((t) => (
              <button
                key={t}
                onClick={() => setTipoFilter(t)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                  tipoFilter === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {t}
              </button>
            ))}
            <span className="mx-2 h-4 w-px bg-border" />
            <button
              onClick={() => setStatusFilter("")}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                !statusFilter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              Qualquer status
            </button>
            {statusList.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                  statusFilter === s ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {!searchTerm && !tipoFilter && !statusFilter && featuredProperties.length > 0 && (
          <section className="container pb-6">
            <div className="mb-6 space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Seleção especial</p>
              <h2 className="text-3xl font-black text-foreground">Destaques do portfólio</h2>
              <p className="text-muted-foreground">Os imóveis mais estratégicos publicados por {brokerName}.</p>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {featuredProperties.map((property) => <PropertyCard key={property.id} p={property} brokerName={brokerName} whatsapp={whatsapp} />)}
            </div>
          </section>
        )}

        <section className="container py-8 space-y-10">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Portfólio atual</p>
            <h2 className="text-3xl font-black text-foreground">Imóveis em carteira</h2>
            <p className="text-muted-foreground">
              {filteredProperties.length} resultado{filteredProperties.length === 1 ? "" : "s"} encontrado{filteredProperties.length === 1 ? "" : "s"} para este corretor.
            </p>
          </div>

          {propertiesByCity.length > 0 ? (
            propertiesByCity.map(({ city, items }) => (
              <section key={city} className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-foreground">{city}</h3>
                    <p className="text-sm text-muted-foreground">{items.length} imóvel{items.length === 1 ? "" : "eis"} disponível{items.length === 1 ? "" : "is"}</p>
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((property) => <PropertyCard key={property.id} p={property} brokerName={brokerName} whatsapp={whatsapp} />)}
                </div>
              </section>
            ))
          ) : (
            <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
              <p className="text-lg font-semibold text-foreground">Nenhum imóvel encontrado</p>
              <p className="mt-2 text-muted-foreground">Ajuste a busca ou volte mais tarde para conferir novas oportunidades.</p>
            </div>
          )}
        </section>

        {soldProperties.length > 0 && !searchTerm && (
          <section className="border-y border-border bg-muted/40">
            <div className="container py-14">
              <div className="mb-6 space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Prova social</p>
                <h2 className="text-3xl font-black text-foreground">Histórico de vendas</h2>
                <p className="text-muted-foreground">{soldProperties.length} imóvel{soldProperties.length === 1 ? "" : "eis"} vendido{soldProperties.length === 1 ? "" : "s"} com VGV público de {formatCurrency(soldValue)}.</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {soldProperties.slice(0, 6).map((property) => (
                  <article key={property.id} className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
                    <div className="relative h-56 overflow-hidden">
                      <img src={property.imagens?.[0] || "/placeholder.svg"} alt={property.titulo} loading="lazy" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/10 to-transparent" />
                      <span className="absolute left-4 top-4 rounded-full bg-destructive px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-destructive-foreground">Vendido</span>
                    </div>
                    <div className="space-y-3 p-5">
                      <h3 className="text-lg font-bold text-card-foreground">{property.titulo}</h3>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> {property.endereco}, {property.cidade}</div>
                      <p className="text-2xl font-black text-foreground">{formatCurrency(property.preco)}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {property.area > 0 && <span className="flex items-center gap-1"><Ruler className="h-4 w-4" />{property.area}m²</span>}
                        {property.quartos > 0 && <span className="flex items-center gap-1"><BedDouble className="h-4 w-4" />{property.quartos}</span>}
                        {property.vagas > 0 && <span className="flex items-center gap-1"><Car className="h-4 w-4" />{property.vagas}</span>}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
        <BrokerRatings brokerId={brokerId} brokerName={brokerName} />
      </main>

      <footer className="border-t border-border bg-card">
        <div className="container flex flex-col gap-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-foreground">{brokerName}{creci && ` · CRECI ${creci}`}</p>
            <p>{config?.footer_text || "Portfólio público de imóveis atualizado em tempo real."}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {email && (
              <a href={`mailto:${email}`} className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2.5 font-semibold text-foreground transition-colors hover:bg-muted">
                <Mail className="h-4 w-4" /> Email
              </a>
            )}
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}?text=${whatsappGeneral}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2.5 font-semibold text-accent-foreground transition-opacity hover:opacity-90">
                <Phone className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
