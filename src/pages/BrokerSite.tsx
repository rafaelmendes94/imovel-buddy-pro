import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  MapPin, BedDouble, Bath, Car, Ruler, Phone, Home, ArrowLeft, Star, Waves,
  Paintbrush, Repeat, CreditCard, Building2, TreePine, Search, X, SlidersHorizontal,
  ChevronDown, Fence, DollarSign, Clock, FileCheck, Eye, ShieldCheck, MessageSquare,
  Send, ThumbsUp, Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SiteConfigDialog } from "@/components/SiteConfigDialog";

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface DBProperty {
  id: string;
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
  return (
    <div className="group rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100">
      <div className="relative h-52 overflow-hidden">
        <img src={img} alt={p.titulo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span className={cn("absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold text-white uppercase tracking-wide",
          p.status === "Vendido" ? "bg-red-500" : p.status === "Reservado" ? "bg-amber-500" : "bg-emerald-500"
        )}>{p.status}</span>
        <div className="absolute bottom-12 left-3 flex gap-1.5 flex-wrap">
          {p.vista_mar && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/90 text-white backdrop-blur-sm flex items-center gap-1"><Waves className="w-3 h-3" /> Vista Mar</span>}
          {p.decorado && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/90 text-white backdrop-blur-sm flex items-center gap-1"><Paintbrush className="w-3 h-3" /> Decorado</span>}
        </div>
        <div className="absolute bottom-3 left-3"><p className="text-xl font-bold text-white drop-shadow-lg">{formatCurrency(p.preco)}</p></div>
      </div>
      <div className="p-4 space-y-3">
        <h3 className="font-bold text-gray-900 text-base leading-tight">{p.titulo}</h3>
        {(p.empreendimento || p.unidade || p.quadra) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {p.empreendimento && <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">{p.empreendimento}</span>}
            {p.unidade && <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">{p.unidade}</span>}
            {p.quadra && <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">{p.quadra}</span>}
            {p.lote && <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">{p.lote}</span>}
          </div>
        )}
        <div className="flex items-center gap-1 text-gray-500 text-xs"><MapPin className="w-3.5 h-3.5" /><span>{p.endereco}, {p.cidade}</span></div>
        {(p.quartos > 0 || p.area > 0) && (
          <div className="flex items-center gap-4 pt-2 border-t border-gray-100 text-xs text-gray-600">
            {p.area > 0 && <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" />{p.area}m²</span>}
            {p.quartos > 0 && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{p.quartos}</span>}
            {p.banheiros > 0 && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{p.banheiros}</span>}
            {p.vagas > 0 && <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5" />{p.vagas}</span>}
          </div>
        )}
        {p.condicoes_pagamento && p.condicoes_pagamento.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {p.condicoes_pagamento.map(c => <span key={c} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700">{c}</span>)}
          </div>
        )}
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp}?text=${msg}`} target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm">
            <Phone className="w-4 h-4" /> Tenho Interesse
          </a>
        )}
      </div>
    </div>
  );
}

const toSlug = (name: string) =>
  name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function BrokerSite() {
  const { slug } = useParams<{ slug: string }>();

  const [brokerName, setBrokerName] = useState("");
  const [properties, setProperties] = useState<DBProperty[]>([]);
  const [soldProperties, setSoldProperties] = useState<DBProperty[]>([]);
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string | null; phone: string | null; email: string | null } | null>(null);
  const [brokerInfo, setBrokerInfo] = useState<{ phone: string | null; creci: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      if (!slug) { setLoading(false); return; }

      // Find broker by matching slug against all subscriber_brokers
      const { data: allBrokers } = await supabase
        .from("subscriber_brokers")
        .select("name, phone, creci");

      const match = (allBrokers || []).find(b => toSlug(b.name) === slug);
      
      // Also check profiles if no broker match
      let resolvedName = match?.name || "";
      if (!resolvedName) {
        const { data: allProfiles } = await supabase
          .from("profiles")
          .select("full_name");
        const profMatch = (allProfiles || []).find(p => toSlug(p.full_name) === slug);
        resolvedName = profMatch?.full_name || "";
      }

      if (!resolvedName) { setLoading(false); return; }
      setBrokerName(resolvedName);

      if (match) setBrokerInfo({ phone: match.phone, creci: match.creci });

      const { data: available } = await supabase
        .from("imoveis")
        .select("*")
        .eq("corretor_nome", resolvedName)
        .in("status", ["Disponível", "Reservado"])
        .eq("ativo_site", true);

      const { data: sold } = await supabase
        .from("imoveis")
        .select("*")
        .eq("corretor_nome", resolvedName)
        .eq("status", "Vendido");

      setProperties((available as any) || []);
      setSoldProperties((sold as any) || []);

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, phone, email")
        .eq("full_name", resolvedName)
        .maybeSingle();
      setProfile(prof);

      setLoading(false);
    };
    load();
  }, [slug]);

  useEffect(() => {
    if (soldProperties.length <= 1) return;
    const interval = setInterval(() => setCarouselIndex(prev => (prev + 1) % soldProperties.length), 4000);
    return () => clearInterval(interval);
  }, [soldProperties.length]);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Carregando...</p></div>;

  const allProps = [...properties, ...soldProperties];
  if (allProps.length === 0 && !profile && !brokerInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-500 text-lg">Corretor não encontrado</p>
          <Link to="/site" className="text-amber-600 font-bold hover:underline">← Voltar ao site</Link>
        </div>
      </div>
    );
  }

  const whatsapp = brokerInfo?.phone || profile?.phone || "";
  const creci = brokerInfo?.creci || "";
  const avatarUrl = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(brokerName)}&background=f59e0b&color=fff&size=200`;
  const totalValue = properties.reduce((s, p) => s + Number(p.preco), 0);
  const soldValue = soldProperties.reduce((s, p) => s + Number(p.preco), 0);

  const apartments = properties.filter(p => p.tipo === "Apartamento");
  const houses = properties.filter(p => p.tipo === "Casa");
  const lots = properties.filter(p => p.tipo === "Terreno" || p.tipo === "Lote");

  const filtered = searchTerm
    ? properties.filter(p => p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || p.endereco.toLowerCase().includes(searchTerm.toLowerCase()) || p.cidade.toLowerCase().includes(searchTerm.toLowerCase()))
    : properties;

  const cities = [...new Set(properties.map(p => p.cidade))];
  const byCity = cities.map(c => ({ city: c, items: filtered.filter(p => p.cidade === c) })).filter(g => g.items.length > 0);

  const whatsappGeneral = encodeURIComponent(`Olá ${brokerName}! Vi seu portfólio de imóveis e gostaria de mais informações.`);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/site" className="flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-lg font-extrabold text-gray-900">MV <span className="text-amber-500">Broker</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowConfig(true)} className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors" title="Configurações"><SettingsIcon className="w-4 h-4" /></button>
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}?text=${whatsappGeneral}`} target="_blank" rel="noopener noreferrer" className="px-5 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm">
                <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> Fale Comigo</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative">
              <img src={avatarUrl} alt={brokerName} className="w-36 h-36 rounded-full object-cover border-4 border-amber-400 shadow-2xl" />
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center border-3 border-white shadow-lg">
                <Star className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-center sm:text-left space-y-3 flex-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{brokerName}</h1>
              {creci && <p className="text-amber-400 font-bold text-sm tracking-wide">CRECI {creci}</p>}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-white font-extrabold text-lg leading-none">{properties.length}</p>
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider">Em Carteira</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-white font-extrabold text-lg leading-none">{formatCurrency(totalValue)}</p>
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider">VGV Carteira</p>
                  </div>
                </div>
                {soldProperties.length > 0 && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="text-white font-extrabold text-lg leading-none">{formatCurrency(soldValue)}</p>
                      <p className="text-gray-400 text-[10px] uppercase tracking-wider">VGV Vendido ({soldProperties.length})</p>
                    </div>
                  </div>
                )}
                {whatsapp && (
                  <a href={`https://wa.me/${whatsapp}?text=${whatsappGeneral}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-colors shadow-lg">
                    <Phone className="w-4 h-4" /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mt-8">
            <div className="flex items-center bg-white rounded-2xl p-2 shadow-xl max-w-lg">
              <Search className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
              <input type="text" placeholder="Buscar imóvel..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent" />
              {searchTerm && <button onClick={() => setSearchTerm("")} className="p-1.5 rounded-lg hover:bg-gray-100 mr-1"><X className="w-4 h-4 text-gray-400" /></button>}
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-300 mt-4">
              <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-amber-400" /> {apartments.length} Aptos</span>
              <span className="flex items-center gap-1.5"><Home className="w-4 h-4 text-amber-400" /> {houses.length} Casas</span>
              <span className="flex items-center gap-1.5"><TreePine className="w-4 h-4 text-amber-400" /> {lots.length} Terrenos</span>
            </div>
          </div>
        </div>
      </section>

      {/* Properties */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {searchTerm ? (
          <section>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Resultados para "{searchTerm}" ({filtered.length})</h2>
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(p => <PropertyCard key={p.id} p={p} brokerName={brokerName} whatsapp={whatsapp} />)}
              </div>
            ) : <p className="text-center py-12 text-gray-400">Nenhum imóvel encontrado.</p>}
          </section>
        ) : (
          <>
            {byCity.map(({ city, items }) => (
              <section key={city}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center shadow-md">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-gray-900">{city}</h2>
                    <p className="text-sm text-gray-500">{items.length} imóveis</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map(p => <PropertyCard key={p.id} p={p} brokerName={brokerName} whatsapp={whatsapp} />)}
                </div>
              </section>
            ))}
          </>
        )}

        {/* Sold Carousel */}
        {soldProperties.length > 0 && !searchTerm && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center shadow-md">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Últimas Vendas — {formatCurrency(soldValue)}</h2>
                <p className="text-sm text-gray-500">{soldProperties.length} imóveis vendidos</p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl bg-gray-900 shadow-xl">
              <div ref={carouselRef} className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${carouselIndex * 100}%)` }}>
                {soldProperties.map(p => (
                  <div key={p.id} className="min-w-full flex flex-col sm:flex-row">
                    <div className="relative sm:w-1/2 h-56 sm:h-72 overflow-hidden">
                      <img src={p.imagens?.[0] || "/placeholder.svg"} alt={p.titulo} className="w-full h-full object-cover" />
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold bg-red-500 text-white uppercase tracking-wide">Vendido</span>
                    </div>
                    <div className="sm:w-1/2 p-6 flex flex-col justify-center text-white space-y-3">
                      <h3 className="text-xl font-bold">{p.titulo}</h3>
                      {p.empreendimento && <p className="text-amber-400 text-sm font-semibold">{p.empreendimento}</p>}
                      <div className="flex items-center gap-1.5 text-gray-400 text-sm"><MapPin className="w-4 h-4" /><span>{p.endereco}, {p.cidade}</span></div>
                      <p className="text-2xl font-black text-emerald-400">{formatCurrency(p.preco)}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        {p.area > 0 && <span>{p.area}m²</span>}
                        {p.quartos > 0 && <span>{p.quartos} quartos</span>}
                        {p.banheiros > 0 && <span>{p.banheiros} ban.</span>}
                        {p.vagas > 0 && <span>{p.vagas} vagas</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {soldProperties.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  {soldProperties.map((_, i) => (
                    <button key={i} onClick={() => setCarouselIndex(i)} className={cn("w-2.5 h-2.5 rounded-full transition-colors", i === carouselIndex ? "bg-amber-400" : "bg-white/30")} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {properties.length === 0 && soldProperties.length === 0 && (
          <p className="text-center py-16 text-gray-400 text-lg">Nenhum imóvel disponível no momento.</p>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-lg font-extrabold text-white">MV <span className="text-amber-400">Broker</span></span>
          <p className="text-sm">{brokerName}{creci && ` — CRECI ${creci}`}</p>
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors">
              <Phone className="w-4 h-4" /> WhatsApp
            </a>
          )}
          <p className="text-xs text-gray-600 pt-4">© 2026 MV BROKER CONNECT. Todos os direitos reservados.</p>
        </div>
      </footer>

      <SiteConfigDialog open={showConfig} onOpenChange={setShowConfig} configType="broker_page" ownerId={slug} showProfilePhoto title="Configuração da Página do Corretor" />
    </div>
  );
}
