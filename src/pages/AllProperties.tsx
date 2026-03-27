import { useState } from "react";
import { Link } from "react-router-dom";
import { properties, formatCurrency, type Property } from "@/data/mockData";
import { PropertyDetailModal } from "@/components/PropertyDetailModal";
import {
  Search, MapPin, BedDouble, Bath, Car, Ruler, Phone,
  ChevronLeft, ChevronRight, Star, Building2, Home, X,
  Waves, Paintbrush, SlidersHorizontal, ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const brokerInfo: Record<string, { photo: string; whatsapp: string }> = {
  "Carlos Silva": {
    photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face",
    whatsapp: "5511999990001",
  },
  "Ana Rodrigues": {
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face",
    whatsapp: "5511999990002",
  },
  "Marcos Oliveira": {
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    whatsapp: "5511999990003",
  },
};

const allSiteProperties = [
  ...properties,
  {
    id: "site-1", title: "Apartamento Beira Mar Navegantes", address: "Av. Beira Mar, 1800", city: "Capão da Canoa",
    type: "Apartamento" as const, status: "Disponível" as const, price: 780000, area: 95, bedrooms: 2, bathrooms: 2, parking: 1,
    broker: "Ana Rodrigues", image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop",
    images: [], createdAt: "2024-03-20", lat: -29.743, lng: -50.098, decorated: false, seaView: true, acceptsExchange: true,
    paymentConditions: ["48x", "Permuta"], empreendimento: "Ed. Navegantes", unitNumber: "Ap 501", boxNumber: "Box 15",
  },
  {
    id: "site-2", title: "Lote Condomínio Reserva do Litoral", address: "Rua dos Pescadores, 500", city: "Xangri-lá",
    type: "Terreno" as const, status: "Disponível" as const, price: 280000, area: 400, bedrooms: 0, bathrooms: 0, parking: 0,
    broker: "Carlos Silva", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop",
    images: [], createdAt: "2024-03-18", lat: -29.802, lng: -50.048, decorated: false, seaView: false, acceptsExchange: true,
    paymentConditions: ["24x", "Permuta"], empreendimento: "Cond. Reserva do Litoral", quadra: "Q-08", lote: "L-22",
  },
  {
    id: "site-3", title: "Casa de Praia Xangri-lá", address: "Rua das Dunas, 120", city: "Xangri-lá",
    type: "Casa" as const, status: "Disponível" as const, price: 1350000, area: 280, bedrooms: 4, bathrooms: 3, parking: 2,
    broker: "Marcos Oliveira", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop",
    images: [], createdAt: "2024-03-15", lat: -29.795, lng: -50.058, decorated: true, seaView: true, acceptsExchange: false,
    paymentConditions: ["72x"], empreendimento: "Cond. Praia das Dunas", quadra: "Q-02", lote: "L-11",
  },
  {
    id: "site-4", title: "Lote Residencial Capão Novo", address: "Rua das Gaivotas, 80", city: "Capão da Canoa",
    type: "Terreno" as const, status: "Disponível" as const, price: 190000, area: 360, bedrooms: 0, bathrooms: 0, parking: 0,
    broker: "Ana Rodrigues", image: "https://images.unsplash.com/photo-1500076656116-558758c991c1?w=600&h=400&fit=crop",
    images: [], createdAt: "2024-03-10", lat: -29.76, lng: -50.09, decorated: false, seaView: false, acceptsExchange: false,
    paymentConditions: ["36x"], empreendimento: "Loteamento Capão Novo", quadra: "Q-14", lote: "L-03",
  },
  {
    id: "site-5", title: "Sobrado Praia de Arroio Teixeira", address: "Rua Marítima, 350", city: "Capão da Canoa",
    type: "Casa" as const, status: "Disponível" as const, price: 850000, area: 180, bedrooms: 3, bathrooms: 2, parking: 2,
    broker: "Carlos Silva", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop",
    images: [], createdAt: "2024-03-08", lat: -29.735, lng: -50.115, decorated: true, seaView: false, acceptsExchange: true,
    paymentConditions: ["36x", "Carro"], empreendimento: "Cond. Arroio Teixeira", quadra: "Q-03", lote: "L-09",
  },
  {
    id: "site-6", title: "Apartamento Alto Padrão Atlântida", address: "Av. Atlântida, 600", city: "Xangri-lá",
    type: "Apartamento" as const, status: "Disponível" as const, price: 1100000, area: 150, bedrooms: 3, bathrooms: 3, parking: 2,
    broker: "Marcos Oliveira", image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop",
    images: [], createdAt: "2024-03-01", lat: -29.785, lng: -50.07, decorated: true, seaView: true, acceptsExchange: true,
    paymentConditions: ["60x", "Permuta"], empreendimento: "Ed. Alto Padrão Atlântida", unitNumber: "Ap 801", boxNumber: "Box 25, 26",
  },
];

const available = allSiteProperties.filter((p) => p.status === "Disponível");

function PropertyCard({ property, onSelect }: { property: typeof allSiteProperties[0]; onSelect?: (p: typeof allSiteProperties[0]) => void }) {
  const [imgIndex, setImgIndex] = useState(0);
  const broker = brokerInfo[property.broker] || { photo: "", whatsapp: "5511999999999" };
  const whatsappMessage = encodeURIComponent(`Olá! Tenho interesse no imóvel: ${property.title} - ${formatCurrency(property.price)}`);
  const unitParts = [property.unitNumber, property.boxNumber, property.quadra, property.lote].filter(Boolean);
  const imgs = property.images && property.images.length > 0 ? property.images : [property.image];
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.address}, ${property.city}`)}`;

  return (
    <div className="group rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100">
      <div className="relative h-52 overflow-hidden cursor-pointer" onClick={() => onSelect?.(property)}>
        <img src={imgs[imgIndex]} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {imgs.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setImgIndex((prev) => (prev > 0 ? prev - 1 : imgs.length - 1)); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <ChevronLeft className="w-4 h-4 text-gray-800" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setImgIndex((prev) => (prev < imgs.length - 1 ? prev + 1 : 0)); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <ChevronRight className="w-4 h-4 text-gray-800" />
            </button>
          </>
        )}
        <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white uppercase tracking-wide">
          {property.status}
        </span>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <p className="text-xl font-bold text-white drop-shadow-lg">{formatCurrency(property.price)}</p>
          <div className="flex gap-1.5">
            {property.seaView && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/90 text-white backdrop-blur-sm flex items-center gap-1">
                <Waves className="w-3 h-3" /> Mar
              </span>
            )}
            {property.decorated && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/90 text-white backdrop-blur-sm flex items-center gap-1">
                <Paintbrush className="w-3 h-3" /> Dec.
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <h3 className="font-bold text-gray-900 text-base leading-tight cursor-pointer hover:text-amber-700 transition-colors" onClick={() => onSelect?.(property)}>
          {property.title}
        </h3>
        {(property.empreendimento || unitParts.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {property.empreendimento && (
              <Link
                to={`/empreendimento/${property.empreendimento.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`}
                className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md hover:bg-amber-100 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {property.empreendimento}
              </Link>
            )}
            {unitParts.map((part) => (
              <span key={part} className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">{part}</span>
            ))}
          </div>
        )}
        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-gray-500 text-xs hover:text-amber-600 transition-colors" onClick={(e) => e.stopPropagation()}>
          <MapPin className="w-3.5 h-3.5" />
          <span>{property.address}, {property.city}</span>
        </a>
        {(property.bedrooms > 0 || property.area > 0) && (
          <div className="flex items-center gap-4 pt-2 border-t border-gray-100 text-xs text-gray-600">
            <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" />{property.area}m²</span>
            {property.bedrooms > 0 && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{property.bedrooms} quartos</span>}
            {property.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{property.bathrooms} ban.</span>}
            {property.parking > 0 && <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5" />{property.parking} vagas</span>}
          </div>
        )}
        {property.paymentConditions && property.paymentConditions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {property.paymentConditions.map((cond) => (
              <span key={cond} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700">{cond}</span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <Link to={`/corretor/${property.broker.toLowerCase().replace(/\s+/g, "-")}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            {broker.photo && <img src={broker.photo} alt={property.broker} className="w-8 h-8 rounded-full object-cover border-2 border-amber-400" />}
            <div>
              <p className="text-xs font-semibold text-amber-700 leading-tight hover:underline">{property.broker}</p>
              <p className="text-[10px] text-gray-400">Corretor(a)</p>
            </div>
          </Link>
          <a href={`https://wa.me/${broker.whatsapp}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm">
            <Phone className="w-3.5 h-3.5" /> WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AllProperties() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterCity, setFilterCity] = useState("");
  const [filterBedrooms, setFilterBedrooms] = useState("");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCondition, setFilterCondition] = useState("");
  const [priceSort, setPriceSort] = useState<"" | "asc" | "desc">("");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const clearFilters = () => {
    setFilterCity(""); setFilterBedrooms(""); setFilterPriceMin(""); setFilterPriceMax("");
    setFilterType(""); setFilterCondition(""); setSearchTerm(""); setPriceSort("");
  };

  const hasActiveFilters = filterCity || filterBedrooms || filterPriceMin || filterPriceMax || filterType || filterCondition;

  let filtered = available.filter((p) => {
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
          <Link to="/site" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-gray-900">MV <span className="text-amber-500">Broker</span> <span className="text-gray-500 text-sm font-bold">Conect</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/site" className="text-sm font-semibold text-gray-600 hover:text-amber-600 transition-colors">
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
          <p className="text-gray-400 text-sm">{available.length} imóveis disponíveis</p>

          {/* Search + Sort */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center bg-white rounded-xl p-2 shadow-lg flex-1 max-w-xl">
              <Search className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="Buscar por nome, endereço, cidade ou empreendimento..."
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

        {filtered.length > 0 ? (
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

      <PropertyDetailModal
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
        allProperties={allSiteProperties}
        brokerInfo={brokerInfo}
        onSelectSimilar={(p) => setSelectedProperty(p)}
      />
    </div>
  );
}
