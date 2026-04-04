import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/data/mockData";
import {
  Building2, Home as HomeIcon, Fence, TreePine, MapPin, BedDouble, Bath, Car, Ruler,
  ChevronRight, ChevronLeft, Phone, Search, Handshake, Users, ArrowRight, Waves,
  Paintbrush, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SiteProperty {
  id: string; titulo: string; endereco: string; cidade: string; tipo: string;
  preco: number; area: number; quartos: number; banheiros: number; vagas: number;
  imagens: string[]; condominio_id: string | null; vista_mar: boolean; decorado: boolean;
  corretor_nome: string; bairro: string; status: string; condicoes_pagamento: string[];
}

interface SiteConfig {
  site_title: string; slogan: string; header_color: string; accent_color: string;
  whatsapp: string; logo_url: string; cover_photo_url: string; footer_text: string;
  footer_color: string;
}

// --- Carousel Component ---
function PropertyCarousel({ title, icon: Icon, properties, color, linkTo }: {
  title: string; icon: typeof HomeIcon; properties: SiteProperty[]; color: string; linkTo: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  if (properties.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const w = scrollRef.current.offsetWidth;
    scrollRef.current.scrollBy({ left: dir === "left" ? -w * 0.8 : w * 0.8, behavior: "smooth" });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-4 sm:px-0">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-md", color)}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">{properties.length} imóveis</p>
          </div>
        </div>
        <Link to={linkTo} className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-accent hover:underline">
          Ver todos <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="relative group">
        <button onClick={() => scroll("left")} className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-card/90 backdrop-blur-sm shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 sm:px-0 pb-2" style={{ scrollbarWidth: "none" }}>
          {properties.map((p) => (
            <MiniPropertyCard key={p.id} property={p} />
          ))}
        </div>
        <button onClick={() => scroll("right")} className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-card/90 backdrop-blur-sm shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-4 h-4 text-foreground" />
        </button>
      </div>
    </section>
  );
}

function MiniPropertyCard({ property: p }: { property: SiteProperty }) {
  const img = p.imagens?.[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop";
  return (
    <Link to={`/site?tipo=${encodeURIComponent(p.tipo)}`} className="min-w-[260px] sm:min-w-[280px] max-w-[300px] snap-start rounded-xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-lg transition-all flex-shrink-0">
      <div className="relative h-40 overflow-hidden">
        <img src={img} alt={p.titulo} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between">
          <p className="text-base font-bold text-white drop-shadow-lg">{formatCurrency(p.preco)}</p>
          <div className="flex gap-1">
            {p.vista_mar && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-info/90 text-white"><Waves className="w-2.5 h-2.5 inline" /></span>}
            {p.decorado && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/90 text-white"><Paintbrush className="w-2.5 h-2.5 inline" /></span>}
          </div>
        </div>
      </div>
      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-card-foreground text-xs uppercase truncate">{p.titulo}</h3>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
          <MapPin className="w-3 h-3 flex-shrink-0" /> {p.bairro || p.endereco}, {p.cidade}
        </p>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {p.quartos > 0 && <span className="flex items-center gap-0.5"><BedDouble className="w-3 h-3" /> {p.quartos}</span>}
          {p.banheiros > 0 && <span className="flex items-center gap-0.5"><Bath className="w-3 h-3" /> {p.banheiros}</span>}
          {p.vagas > 0 && <span className="flex items-center gap-0.5"><Car className="w-3 h-3" /> {p.vagas}</span>}
          {p.area > 0 && <span className="flex items-center gap-0.5"><Ruler className="w-3 h-3" /> {p.area}m²</span>}
        </div>
      </div>
    </Link>
  );
}

// --- City Card ---
function CityCard({ city, count, image }: { city: string; count: number; image: string }) {
  return (
    <Link to={`/site?cidade=${encodeURIComponent(city)}`} className="relative rounded-2xl overflow-hidden h-48 sm:h-56 group flex-1 min-w-0">
      <img src={image} alt={city} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4">
        <h3 className="text-xl sm:text-2xl font-extrabold text-white drop-shadow-lg">{city}</h3>
        <p className="text-sm text-white/80 font-medium">{count} imóveis disponíveis</p>
      </div>
      <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/40 transition-colors">
        <ArrowRight className="w-5 h-5 text-white" />
      </div>
    </Link>
  );
}

export default function Home() {
  const [properties, setProperties] = useState<SiteProperty[]>([]);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [corretores, setCorretores] = useState<any[]>([]);
  const [parceiros, setParceiros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [propRes, cfgRes, corrRes, parcRes] = await Promise.all([
        supabase.from("imoveis").select("id,titulo,endereco,cidade,tipo,preco,area,quartos,banheiros,vagas,imagens,condominio_id,vista_mar,decorado,corretor_nome,bairro,status,condicoes_pagamento").eq("ativo_site", true).eq("status", "Disponível"),
        supabase.from("site_config").select("*").eq("config_type", "main_site").maybeSingle(),
        supabase.from("subscriber_brokers").select("*").eq("status", "active").limit(20),
        supabase.from("construtoras").select("id,nome,logo_url,cidade,slug").eq("status", "active").limit(20),
      ]);
      if (propRes.data) setProperties(propRes.data as any);
      if (cfgRes.data) setConfig(cfgRes.data as any);
      if (corrRes.data) setCorretores(corrRes.data);
      if (parcRes.data) setParceiros(parcRes.data);
      setLoading(false);
    };
    load();
  }, []);

  // Categorize
  const apartamentos = properties.filter(p => p.tipo === "Apartamento");
  const casasCondo = properties.filter(p => p.tipo === "Casa" && p.condominio_id);
  const lotesCondo = properties.filter(p => p.tipo === "Terreno" && p.condominio_id);
  const casasBairro = properties.filter(p => p.tipo === "Casa" && !p.condominio_id);
  const lotesBairro = properties.filter(p => p.tipo === "Terreno" && !p.condominio_id);

  // City counts
  const normalize = (s: string) => s?.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
  const xangrilaCount = properties.filter(p => normalize(p.cidade).includes("xangri")).length;
  const capaoCount = properties.filter(p => normalize(p.cidade).includes("capao") || normalize(p.cidade).includes("capão")).length;

  const heroImage = config?.cover_photo_url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=600&fit=crop";
  const siteName = config?.site_title || "MV BROKER CONNECT";
  const slogan = config?.slogan || "Seu imóvel dos sonhos está aqui";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {config?.logo_url ? (
            <img src={config.logo_url} alt={siteName} className="h-8 sm:h-10 object-contain" />
          ) : (
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-accent" />
              <span className="font-bold text-sm sm:text-base text-foreground">{siteName}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            Entrar
          </Link>
          <Link to="/registro" className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity">
            Cadastrar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative h-[50vh] sm:h-[60vh] overflow-hidden">
        <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white drop-shadow-xl mb-3">
            {slogan}
          </h1>
          <p className="text-sm sm:text-lg text-white/80 mb-6 max-w-xl">
            {properties.length} imóveis disponíveis no Litoral Norte do RS
          </p>
          <Link
            to="/site"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm sm:text-base hover:opacity-90 transition-opacity shadow-lg"
          >
            <Search className="w-5 h-5" /> Ver Imóveis
          </Link>
        </div>
      </section>

      <div className="max-w-7xl mx-auto space-y-10 sm:space-y-14 py-8 sm:py-12">

        {/* City Cards */}
        <section className="px-4 sm:px-0">
          <div className="flex items-center gap-3 mb-5 px-4 sm:px-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-info flex items-center justify-center shadow-md">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-foreground">Explore por Cidade</h2>
          </div>
          <div className="flex gap-4">
            <CityCard
              city="Xangri-lá"
              count={xangrilaCount}
              image="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop"
            />
            <CityCard
              city="Capão da Canoa"
              count={capaoCount}
              image="https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&h=400&fit=crop"
            />
          </div>
        </section>

        {/* Property Carousels */}
        <PropertyCarousel
          title="Apartamentos"
          icon={Building2}
          properties={apartamentos}
          color="bg-gradient-to-br from-amber-500 to-amber-400"
          linkTo="/site?tipo=Apartamento"
        />

        <PropertyCarousel
          title="Casas em Condomínio"
          icon={Fence}
          properties={casasCondo}
          color="bg-gradient-to-br from-emerald-500 to-emerald-400"
          linkTo="/site?tipo=Casa&condo=1"
        />

        <PropertyCarousel
          title="Lotes em Condomínio"
          icon={TreePine}
          properties={lotesCondo}
          color="bg-gradient-to-br from-blue-500 to-blue-400"
          linkTo="/site?tipo=Terreno&condo=1"
        />

        <PropertyCarousel
          title="Casas no Bairro"
          icon={HomeIcon}
          properties={casasBairro}
          color="bg-gradient-to-br from-violet-500 to-violet-400"
          linkTo="/site?tipo=Casa"
        />

        <PropertyCarousel
          title="Lotes no Bairro"
          icon={TreePine}
          properties={lotesBairro}
          color="bg-gradient-to-br from-rose-500 to-rose-400"
          linkTo="/site?tipo=Terreno"
        />

        {/* Corretores */}
        {corretores.length > 0 && (
          <section className="px-4 sm:px-0 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-foreground">Nossos Corretores</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2" style={{ scrollbarWidth: "none" }}>
              {corretores.map((c) => (
                <div key={c.id} className="min-w-[200px] snap-start rounded-xl bg-card border border-border p-4 flex flex-col items-center gap-2 flex-shrink-0 text-center">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-2xl font-bold text-muted-foreground">
                    {c.name?.charAt(0) || "C"}
                  </div>
                  <h4 className="font-semibold text-sm text-card-foreground">{c.name}</h4>
                  {c.creci && <p className="text-[11px] text-muted-foreground">CRECI {c.creci}</p>}
                  {c.phone && (
                    <a href={`https://wa.me/${c.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success text-success-foreground text-[11px] font-bold hover:opacity-90 transition-opacity mt-1">
                      <Phone className="w-3 h-3" /> WhatsApp
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Parceiros */}
        {parceiros.length > 0 && (
          <section className="px-4 sm:px-0 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center shadow-md">
                  <Handshake className="w-5 h-5 text-background" />
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-foreground">Parceiros</h2>
              </div>
              <Link to="/parceiros" className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-accent hover:underline">
                Ver todos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2" style={{ scrollbarWidth: "none" }}>
              {parceiros.map((p) => (
                <Link key={p.id} to={`/construtora/${p.slug}`} className="min-w-[180px] snap-start rounded-xl bg-card border border-border p-4 flex flex-col items-center gap-2 flex-shrink-0 text-center hover:shadow-md transition-shadow">
                  {p.logo_url ? (
                    <img src={p.logo_url} alt={p.nome} className="w-14 h-14 rounded-full object-cover border-2 border-border" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-xl font-bold text-muted-foreground">
                      {p.nome?.charAt(0)}
                    </div>
                  )}
                  <h4 className="font-semibold text-xs text-card-foreground truncate max-w-full">{p.nome}</h4>
                  {p.cidade && <p className="text-[10px] text-muted-foreground">{p.cidade}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-10 py-8 px-4 text-center border-t border-border bg-card">
        <p className="text-xs text-muted-foreground">{config?.footer_text || "© 2026 MV BROKER CONNECT. Todos os direitos reservados."}</p>
        <div className="flex justify-center gap-4 mt-3">
          <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground">Área do Corretor</Link>
          <Link to="/parceiros" className="text-xs text-muted-foreground hover:text-foreground">Parceiros</Link>
        </div>
      </footer>
    </div>
  );
}
