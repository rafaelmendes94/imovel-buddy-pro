import { PLACEHOLDER_IMAGE } from "@/lib/placeholderImage";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { PropertyDetailModal } from "@/components/PropertyDetailModal";
import {
  Search, MapPin, BedDouble, Bath, Car, Ruler, Phone, Mail,
  ChevronLeft, ChevronRight, Star, Building2, Home, X,
  Waves, Paintbrush, SlidersHorizontal, ChevronDown,
  ArrowUpDown, Heart, Route,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toSlug } from "@/lib/utils";
import { trackPropertyView } from "@/lib/trackPropertyView";

interface SiteProperty {
  id: string;
  title: string;
  address: string;
  city: string;
  type: string;
  status: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  broker: string;
  brokerPhoto?: string;
  brokerWhatsapp?: string;
  image: string;
  images: string[];
  createdAt: string;
  decorated?: boolean;
  seaView?: boolean;
  acceptsExchange?: boolean;
  paymentConditions?: string[];
  empreendimento?: string;
  edificioId?: string;
  condominioId?: string;
  empreendimentoId?: string;
  unitNumber?: string;
  boxNumber?: string;
  quadra?: string;
  lote?: string;
}

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop&crop=face";
const normalizePhone = (p?: string) => (p || "").replace(/\D/g, "");

function PropertyCard({ property, onSelect, isFavorited, onToggleFavorite, isInRoute, onToggleRoute }: { property: SiteProperty; onSelect?: (p: SiteProperty) => void; isFavorited?: boolean; onToggleFavorite?: (id: string) => void; isInRoute?: boolean; onToggleRoute?: (id: string) => void }) {
  const [imgIndex, setImgIndex] = useState(0);
  const imgs = property.images && property.images.length > 0 ? property.images : [property.image];
  const unitParts = [property.unitNumber, property.boxNumber, property.quadra, property.lote].filter(Boolean);
  const whatsappMessage = encodeURIComponent(`Olá! Tenho interesse no imóvel: ${property.title} - ${formatCurrency(property.price)}`);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.address}, ${property.city}`)}`;
  const brokerPhoto = property.brokerPhoto || FALLBACK_AVATAR;

  return (
    <div className="group rounded-xl overflow-hidden bg-card shadow-md hover:shadow-xl transition-all duration-300 border border-border flex flex-col h-full min-h-[300px]">
      {/* Image area */}
      <div className="relative cursor-pointer" onClick={() => onSelect?.(property)}>
        <div className="relative h-52 overflow-hidden">
          <img
            src={imgs[imgIndex]}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        {/* Sold stamp */}
        {property.status === "Vendido" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-red-600/90 text-white text-2xl font-black uppercase tracking-[0.2em] px-8 py-3 -rotate-12 shadow-2xl border-4 border-red-400/50 rounded-sm" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.4)' }}>
              Vendido
            </div>
          </div>
        )}

        {/* Status badge */}
        {property.status !== "Disponível" && (
          <span className={cn(
            "absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide z-20",
            property.status === "Vendido" ? "bg-red-500 text-white" : "bg-blue-500 text-white"
          )}>
            {property.status}
          </span>
        )}

        {/* Route selector */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleRoute?.(property.id); }}
          className={cn(
            "absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110",
            isInRoute ? "bg-blue-600 text-white" : "bg-foreground/30 text-white hover:bg-blue-600"
          )}
          title={isInRoute ? "Remover da rota" : "Adicionar à rota"}
        >
          <Route className={cn("w-4 h-4", isInRoute && "fill-current")} />
        </button>

        {/* Favorite */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(property.id); }}
          className={cn(
            "absolute top-12 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110",
            isFavorited ? "bg-red-500 text-white" : "bg-foreground/30 text-white hover:bg-red-500"
          )}
          title={isFavorited ? "Remover dos favoritos" : "Favoritar"}
        >
          <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
        </button>

        {/* Arrow navigation */}
        {imgs.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setImgIndex((prev) => (prev > 0 ? prev - 1 : imgs.length - 1)); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-foreground/50 backdrop-blur-sm hover:bg-foreground/70 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity z-20"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setImgIndex((prev) => (prev < imgs.length - 1 ? prev + 1 : 0)); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-foreground/50 backdrop-blur-sm hover:bg-foreground/70 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity z-20"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1">
              {imgs.map((_, i) => (
                <span key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all", i === imgIndex ? "bg-white w-3" : "bg-white/50")} />
              ))}
            </div>
          </>
        )}

        {/* Price + badges */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <p className="text-xl font-bold text-white drop-shadow-lg">{formatCurrency(property.price)}</p>
          <div className="flex gap-1">
            {property.seaView && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/90 text-white backdrop-blur-sm flex items-center gap-0.5"><Waves className="w-2.5 h-2.5" /> Mar</span>}
            {property.decorated && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/90 text-white backdrop-blur-sm flex items-center gap-0.5"><Paintbrush className="w-2.5 h-2.5" /> Dec.</span>}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div>
          <h3
            className="font-semibold text-card-foreground text-sm cursor-pointer hover:text-primary transition-colors uppercase"
            onClick={() => onSelect?.(property)}
          >{property.title}</h3>
          {(property.empreendimento || unitParts.length > 0) && (
            <div className="flex flex-wrap items-center gap-1 mt-1">
              {property.empreendimento && (
                <Link
                  to={`/empreendimento/${toSlug(property.empreendimento)}`}
                  className="text-[13px] font-bold text-foreground uppercase tracking-wide bg-white px-2.5 py-0.5 rounded-md border border-foreground/20 hover:bg-muted transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {property.empreendimento}
                </Link>
              )}
              {unitParts.map((part) => (
                <span key={part} className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{part}</span>
              ))}
            </div>
          )}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 mt-1 text-muted-foreground text-xs hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <MapPin className="w-3 h-3" />
            <span>{property.address}, {property.city}</span>
          </a>
        </div>

        {/* Specs row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground py-2 border-y border-border">
          {property.area > 0 && <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> {property.area}m²</span>}
          {property.bedrooms > 0 && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {property.bedrooms}</span>}
          {property.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {property.bathrooms}</span>}
          {property.parking > 0 && <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5" /> {property.parking}</span>}
        </div>

        {/* Payment conditions */}
        {property.paymentConditions && property.paymentConditions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {property.paymentConditions.map((cond) => (
              <span key={cond} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                {cond}
              </span>
            ))}
          </div>
        )}

        {/* Broker + WhatsApp */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border mt-auto">
          <Link to={`/corretor/${toSlug(property.broker)}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
            <img
              src={brokerPhoto}
              alt={property.broker}
              className="w-7 h-7 rounded-full object-cover border-2 border-accent flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-foreground truncate">{property.broker}</p>
              <p className="text-[9px] text-muted-foreground">Corretor(a)</p>
            </div>
          </Link>

          {property.brokerWhatsapp && (
            <a
              href={`https://wa.me/${property.brokerWhatsapp}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition-colors shadow-sm flex-shrink-0 whitespace-nowrap"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="w-3 h-3" /> WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}


export default function AllProperties() {
  const [allProperties, setAllProperties] = useState<SiteProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterCity, setFilterCity] = useState("");
  const [filterBedrooms, setFilterBedrooms] = useState("");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCondition, setFilterCondition] = useState("");
  const [priceSort, setPriceSort] = useState<"" | "asc" | "desc">("");
  const [selectedProperty, setSelectedProperty] = useState<SiteProperty | null>(null);
  useEffect(() => { trackPropertyView(selectedProperty?.id); }, [selectedProperty?.id]);
  const sharedIds = (() => {
    const v = new URLSearchParams(window.location.search).get("ids");
    return v ? v.split(",").filter(Boolean) : null;
  })();

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      let query = supabase
        .from('imoveis')
        .select('*, edificios(nome), condominios(nome), empreendimentos(nome)');
      if (sharedIds && sharedIds.length) {
        query = query.in('id', sharedIds);
      } else {
        query = query.eq('ativo_site', true).neq('status', 'Vendido');
      }
      const { data, error } = await query;

      if (!error && data) {
        const ownerIds = Array.from(new Set(data.map((r: any) => r.user_id).filter(Boolean)));
        const profilesById: Record<string, { full_name: string; phone: string | null; avatar_url: string | null }> = {};
        const profilesByName: Record<string, { full_name: string; phone: string | null; avatar_url: string | null }> = {};
        if (ownerIds.length) {
          const { data: profs } = await (supabase as any)
            .from('public_broker_profiles')
            .select('user_id, full_name, phone, avatar_url')
            .in('user_id', ownerIds);
          (profs || []).forEach((p: any) => {
            profilesById[p.user_id] = { full_name: p.full_name || '', phone: p.phone, avatar_url: p.avatar_url };
            if (p.full_name) profilesByName[p.full_name.trim().toLowerCase()] = profilesById[p.user_id];
          });
        }

        const mapped: SiteProperty[] = data
          .filter((row) => sharedIds ? true : row.status === "Disponível")
          .map((row) => {
            const ownerProfile = profilesById[(row as any).user_id];
            // Prioriza o corretor que CADASTROU o imóvel (dono do user_id); corretor_nome só como fallback
            const brokerName = ownerProfile?.full_name?.trim() || (row as any).corretor_nome?.trim() || "Corretor";
            const brokerProfile = ownerProfile || profilesByName[brokerName.toLowerCase()];
            return {
              id: row.id,
              title: row.titulo,
              address: row.endereco,
              city: row.cidade,
              type: row.tipo,
              status: row.status,
              price: Number(row.preco),
              area: Number(row.area),
              bedrooms: row.quartos,
              bathrooms: row.banheiros,
              parking: row.vagas,
              broker: brokerName,
              brokerPhoto: brokerProfile?.avatar_url || undefined,
              brokerWhatsapp: normalizePhone(brokerProfile?.phone || ''),
              image: row.imagens?.[0] || PLACEHOLDER_IMAGE,
              images: row.imagens || [],
              createdAt: row.created_at,
              decorated: row.decorado,
              seaView: row.vista_mar,
              acceptsExchange: row.aceita_permuta,
              paymentConditions: row.condicoes_pagamento || [],
              empreendimento: row.empreendimento || (row as any).edificios?.nome || (row as any).condominios?.nome || (row as any).empreendimentos?.nome || '',
              edificioId: (row as any).edificio_id || '',
              condominioId: (row as any).condominio_id || '',
              empreendimentoId: (row as any).empreendimento_id || '',
              unitNumber: row.unidade || '',
              boxNumber: row.box || '',
              quadra: row.quadra || '',
              lote: row.lote || '',
              exclusivityTermUrl: (row as any).termo_exclusividade_url || '',
              fotosPdfUrl: (row as any).fotos_pdf_url || '',
              materialUrl: (row as any).link_material || (row as any).drive_fotos_url || '',
            };
          });
        setAllProperties(mapped);
      }
      setLoading(false);
    };
    fetchProperties();
  }, []);

  const clearFilters = () => {
    setFilterCity(""); setFilterBedrooms(""); setFilterPriceMin(""); setFilterPriceMax("");
    setFilterType(""); setFilterCondition(""); setSearchTerm(""); setPriceSort("");
  };

  const hasActiveFilters = filterCity || filterBedrooms || filterPriceMin || filterPriceMax || filterType || filterCondition;

  let filtered = allProperties.filter((p) => {
    if (sharedIds && !sharedIds.includes(p.id)) return false;
    const matchSearch = !searchTerm ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.empreendimento && p.empreendimento.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCity = !filterCity || p.city === filterCity;
    const matchBedrooms = !filterBedrooms || p.bedrooms >= parseInt(filterBedrooms);
    const matchPriceMin = !filterPriceMin || p.price >= parseInt(filterPriceMin);
    const matchPriceMax = !filterPriceMax || p.price <= parseInt(filterPriceMax);
    const matchType = !filterType || p.type === filterType;
    const matchCondition = !filterCondition || (
      Array.isArray(p.paymentConditions) && p.paymentConditions.some(c => c.toLowerCase().includes(filterCondition.toLowerCase()))
    );
    return matchSearch && matchCity && matchBedrooms && matchPriceMin && matchPriceMax && matchType && matchCondition;
  });

  if (priceSort) {
    filtered = [...filtered].sort((a, b) => priceSort === "asc" ? a.price - b.price : b.price - a.price);
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-gray-900">MV <span className="text-amber-500">Broker</span> <span className="text-gray-500 text-sm font-bold">Conect</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm font-semibold text-gray-600 hover:text-amber-600 transition-colors">
              ← Voltar ao Site
            </Link>
            <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm">
              WhatsApp
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold text-white mb-2">Todos os Imóveis</h1>
          <p className="text-gray-400 text-sm">
            {loading ? "Carregando..." : `${allProperties.length} imóveis disponíveis`}
          </p>

          {/* Search + Sort */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center bg-white rounded-xl p-2 shadow-lg flex-1 max-w-xl">
              <Search className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="Buscar por nome, endereço, cidade ou loteamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="p-1 rounded-lg hover:bg-gray-100 mr-1">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Sort buttons */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-gray-400" />
              <div className="flex rounded-xl border border-gray-600 overflow-hidden">
                <button
                  onClick={() => setPriceSort(priceSort === "asc" ? "" : "asc")}
                  className={cn(
                    "px-4 py-2 text-xs font-bold transition-colors",
                    priceSort === "asc" ? "bg-amber-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  )}
                >
                  ↑ Menor Valor
                </button>
                <button
                  onClick={() => setPriceSort(priceSort === "desc" ? "" : "desc")}
                  className={cn(
                    "px-4 py-2 text-xs font-bold transition-colors border-l border-gray-600",
                    priceSort === "desc" ? "bg-amber-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  )}
                >
                  ↓ Maior Valor
                </button>
              </div>
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm font-bold hover:bg-white/20 transition-colors border border-white/20"
            >
              <SlidersHorizontal className="w-4 h-4" /> Filtros
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-amber-400" />}
              <ChevronDown className={cn("w-4 h-4 transition-transform", showFilters && "rotate-180")} />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Cidade</label>
                <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">Todas</option>
                  <option value="Capão da Canoa">Capão da Canoa</option>
                  <option value="Xangri-lá">Xangri-lá</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Tipo</label>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">Todos</option>
                  <option value="Apartamento">Apartamento</option>
                  <option value="Casa">Casa</option>
                  <option value="Terreno">Terreno</option>
                  <option value="Comercial">Comercial</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Quartos (mín.)</label>
                <select value={filterBedrooms} onChange={(e) => setFilterBedrooms(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">Qualquer</option>
                  <option value="1">1+</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Preço mín.</label>
                <select value={filterPriceMin} onChange={(e) => setFilterPriceMin(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">Sem mínimo</option>
                  <option value="200000">R$ 200 mil</option><option value="500000">R$ 500 mil</option>
                  <option value="800000">R$ 800 mil</option><option value="1000000">R$ 1 milhão</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Preço máx.</label>
                <select value={filterPriceMax} onChange={(e) => setFilterPriceMax(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">Sem máximo</option>
                  <option value="500000">R$ 500 mil</option><option value="800000">R$ 800 mil</option>
                  <option value="1000000">R$ 1 milhão</option><option value="1500000">R$ 1,5 milhão</option>
                  <option value="2000000">R$ 2 milhões</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Condições</label>
                <select value={filterCondition} onChange={(e) => setFilterCondition(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">Todas</option>
                  <option value="12x">12x</option><option value="24x">24x</option><option value="36x">36x</option>
                  <option value="48x">48x</option><option value="60x">60x</option><option value="72x">72x</option>
                  <option value="84x">84x</option><option value="Permuta">Permuta</option><option value="Carro">Carro</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-1">
                    <X className="w-3.5 h-3.5" /> Limpar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            <span className="font-bold text-gray-900">{filtered.length}</span> imóveis encontrados
            {priceSort && <span className="text-amber-600 font-medium"> · {priceSort === "asc" ? "menor valor primeiro" : "maior valor primeiro"}</span>}
          </p>
          {(searchTerm || hasActiveFilters) && (
            <button onClick={clearFilters} className="text-xs font-bold text-amber-600 hover:text-amber-700">
              Limpar filtros
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-lg font-bold text-gray-400">Carregando imóveis...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((p) => <PropertyCard key={p.id} property={p} onSelect={setSelectedProperty} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-bold text-gray-400">Nenhum imóvel encontrado</p>
            <p className="text-sm text-gray-400 mt-1">Tente ajustar os filtros ou buscar por outro termo.</p>
            <button onClick={clearFilters} className="mt-4 px-6 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors">
              Limpar Filtros
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center">
                  <Home className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-extrabold text-white">MV <span className="text-blue-400">CONNECT</span></span>
              </div>
              <p className="text-sm leading-relaxed">
                Conectando corretores a corretores e imóveis a clientes. Sua plataforma de confiança no litoral.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Navegação</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="hover:text-blue-400 transition-colors">Início</Link></li>
                <li><Link to="/todos-imoveis" className="hover:text-blue-400 transition-colors">Todos os Imóveis</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Contato</h4>
              <div className="space-y-3 text-sm">
                <a href="tel:+5511999999999" className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                  <Phone className="w-4 h-4" /> (11) 99999-9999
                </a>
                <a href="mailto:contato@imobcrm.com" className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                  <Mail className="w-4 h-4" /> contato@imobcrm.com
                </a>
                <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors text-sm mt-2">
                  Fale pelo WhatsApp
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-xs text-gray-500">
            © 2024 MV BROKER CONNECT. Todos os direitos reservados.
          </div>
        </div>
      </footer>


      <PropertyDetailModal
        property={selectedProperty as any}
        onClose={() => setSelectedProperty(null)}
        allProperties={allProperties as any}
        brokerInfo={Object.fromEntries(allProperties.map((p) => [p.broker, { photo: p.brokerPhoto || FALLBACK_AVATAR, whatsapp: p.brokerWhatsapp || "" }]))}
        onSelectSimilar={(p: any) => setSelectedProperty(p)}
      />
    </div>
  );
}
