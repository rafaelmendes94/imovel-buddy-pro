import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { properties, formatCurrency } from "@/data/mockData";
import {
  MapPin,
  BedDouble,
  Bath,
  Car,
  Ruler,
  Phone,
  Home,
  ArrowLeft,
  Star,
  Waves,
  Paintbrush,
  Repeat,
  CreditCard,
  Building2,
  TreePine,
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  Fence,
} from "lucide-react";
import { cn } from "@/lib/utils";

const brokerInfo: Record<string, { photo: string; whatsapp: string; creci: string; bio: string }> = {
  "Carlos Silva": {
    photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face",
    whatsapp: "5511999990001",
    creci: "123456-RS",
    bio: "Especialista em imóveis de alto padrão no litoral norte gaúcho. Mais de 10 anos de experiência no mercado imobiliário.",
  },
  "Ana Rodrigues": {
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face",
    whatsapp: "5511999990002",
    creci: "234567-RS",
    bio: "Corretora dedicada com foco em lotes e terrenos. Atendimento personalizado para encontrar o melhor investimento.",
  },
  "Marcos Oliveira": {
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    whatsapp: "5511999990003",
    creci: "345678-RS",
    bio: "Consultor imobiliário com amplo conhecimento do mercado de Capão da Canoa e Xangri-lá. Foco em resultados.",
  },
};

const allSiteProperties = [
  ...properties,
  {
    id: "site-1",
    title: "Apartamento Beira Mar Navegantes",
    address: "Av. Beira Mar, 1800",
    city: "Capão da Canoa",
    type: "Apartamento" as const,
    status: "Disponível" as const,
    price: 780000,
    area: 95,
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    broker: "Ana Rodrigues",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop",
    images: [],
    createdAt: "2024-03-20",
    lat: -29.7430,
    lng: -50.0980,
    decorated: false,
    seaView: true,
    acceptsExchange: true,
    paymentConditions: "Entrada + 48x",
  },
  {
    id: "site-2",
    title: "Lote Condomínio Reserva do Litoral",
    address: "Rua dos Pescadores, 500",
    city: "Xangri-lá",
    type: "Terreno" as const,
    status: "Disponível" as const,
    price: 280000,
    area: 400,
    bedrooms: 0,
    bathrooms: 0,
    parking: 0,
    broker: "Carlos Silva",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop",
    images: [],
    createdAt: "2024-03-18",
    lat: -29.8020,
    lng: -50.0480,
    decorated: false,
    seaView: false,
    acceptsExchange: true,
    paymentConditions: "À vista ou 24x",
  },
  {
    id: "site-3",
    title: "Casa de Praia Xangri-lá",
    address: "Rua das Dunas, 120",
    city: "Xangri-lá",
    type: "Casa" as const,
    status: "Disponível" as const,
    price: 1350000,
    area: 280,
    bedrooms: 4,
    bathrooms: 3,
    parking: 2,
    broker: "Marcos Oliveira",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop",
    images: [],
    createdAt: "2024-03-15",
    lat: -29.7950,
    lng: -50.0580,
    decorated: true,
    seaView: true,
    acceptsExchange: false,
    paymentConditions: "Financiamento bancário",
  },
  {
    id: "site-5",
    title: "Sobrado Praia de Arroio Teixeira",
    address: "Rua Marítima, 350",
    city: "Capão da Canoa",
    type: "Casa" as const,
    status: "Disponível" as const,
    price: 850000,
    area: 180,
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
    broker: "Carlos Silva",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop",
    images: [],
    createdAt: "2024-03-08",
    lat: -29.7350,
    lng: -50.1150,
    decorated: true,
    seaView: false,
    acceptsExchange: true,
    paymentConditions: "Entrada 30% + financiamento",
  },
  {
    id: "site-6",
    title: "Apartamento Alto Padrão Atlântida",
    address: "Av. Atlântida, 600",
    city: "Xangri-lá",
    type: "Apartamento" as const,
    status: "Disponível" as const,
    price: 1100000,
    area: 150,
    bedrooms: 3,
    bathrooms: 3,
    parking: 2,
    broker: "Marcos Oliveira",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop",
    images: [],
    createdAt: "2024-03-01",
    lat: -29.7850,
    lng: -50.0700,
    decorated: true,
    seaView: true,
    acceptsExchange: true,
    paymentConditions: "Entrada + 60x ou permuta",
  },
];

type Category = "todos" | "apartamentos" | "casas" | "terrenos" | "decorados" | "vista-mar" | "permuta" | "pagamento";

const categories: { key: Category; label: string; icon: typeof Home }[] = [
  { key: "todos", label: "Todos", icon: Home },
  { key: "apartamentos", label: "Apartamentos", icon: Building2 },
  { key: "casas", label: "Casas", icon: Home },
  { key: "terrenos", label: "Terrenos", icon: TreePine },
  { key: "decorados", label: "Decorados", icon: Paintbrush },
  { key: "vista-mar", label: "Vista Mar", icon: Waves },
  { key: "permuta", label: "Permuta", icon: Repeat },
  { key: "pagamento", label: "Pagamento", icon: CreditCard },
];

function SectionHeader({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: typeof Home }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center shadow-md">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function PropertyCard({ property, whatsapp, brokerName }: { property: typeof allSiteProperties[0]; whatsapp: string; brokerName: string }) {
  const whatsappMessage = encodeURIComponent(
    `Olá ${brokerName}! Tenho interesse no imóvel: ${property.title} - ${formatCurrency(property.price)}`
  );

  return (
    <div className="group rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100">
      <div className="relative h-52 overflow-hidden">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white uppercase tracking-wide">
          {property.status}
        </span>
        <div className="absolute top-3 right-3 flex gap-1.5">
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/90 text-gray-800 backdrop-blur-sm">
            {property.type}
          </span>
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/90 text-white backdrop-blur-sm">
            {property.city}
          </span>
        </div>
        <div className="absolute bottom-12 left-3 flex gap-1.5 flex-wrap">
          {property.seaView && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/90 text-white backdrop-blur-sm flex items-center gap-1">
              <Waves className="w-3 h-3" /> Vista Mar
            </span>
          )}
          {property.decorated && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/90 text-white backdrop-blur-sm flex items-center gap-1">
              <Paintbrush className="w-3 h-3" /> Decorado
            </span>
          )}
          {property.acceptsExchange && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/90 text-white backdrop-blur-sm flex items-center gap-1">
              <Repeat className="w-3 h-3" /> Permuta
            </span>
          )}
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-xl font-bold text-white drop-shadow-lg">
            {formatCurrency(property.price)}
          </p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <h3 className="font-bold text-gray-900 text-base leading-tight">{property.title}</h3>
        <div className="flex items-center gap-1 text-gray-500 text-xs">
          <MapPin className="w-3.5 h-3.5" />
          <span>{property.address}, {property.city}</span>
        </div>
        {(property.bedrooms > 0 || property.area > 0) && (
          <div className="flex items-center gap-4 pt-2 border-t border-gray-100 text-xs text-gray-600">
            <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" />{property.area}m²</span>
            {property.bedrooms > 0 && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{property.bedrooms} quartos</span>}
            {property.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{property.bathrooms} ban.</span>}
            {property.parking > 0 && <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5" />{property.parking} vagas</span>}
          </div>
        )}
        {property.paymentConditions && (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg">
            <CreditCard className="w-3.5 h-3.5" />
            <span className="font-semibold">{property.paymentConditions}</span>
          </div>
        )}
        <a
          href={`https://wa.me/${whatsapp}?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm"
        >
          <Phone className="w-4 h-4" /> Tenho Interesse
        </a>
      </div>
    </div>
  );
}

export default function BrokerSite() {
  const { slug } = useParams<{ slug: string }>();
  const brokerName = slug
    ? slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : "";

  const info = brokerInfo[brokerName];
  const brokerProperties = allSiteProperties.filter(
    (p) => p.broker === brokerName && p.status === "Disponível"
  );

  const [activeCategory, setActiveCategory] = useState<Category>("todos");
  const [filterCity, setFilterCity] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterBedrooms, setFilterBedrooms] = useState("");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [filterPermuta, setFilterPermuta] = useState(false);
  const [filterPagamento, setFilterPagamento] = useState(false);

  if (!info) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-500 text-lg">Corretor não encontrado</p>
          <Link to="/site" className="text-amber-600 font-bold hover:underline">
            ← Voltar ao site
          </Link>
        </div>
      </div>
    );
  }

  const hasActiveFilters = filterCity || filterBedrooms || filterPriceMin || filterPriceMax || filterPermuta || filterPagamento;

  const clearFilters = () => {
    setFilterCity("");
    setFilterBedrooms("");
    setFilterPriceMin("");
    setFilterPriceMax("");
    setFilterPermuta(false);
    setFilterPagamento(false);
    setSearchTerm("");
  };

  // Apply base filters (search + advanced)
  const baseFiltered = brokerProperties.filter((p) => {
    const matchSearch = !searchTerm ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCity = !filterCity || p.city === filterCity;
    const matchBedrooms = !filterBedrooms || p.bedrooms >= parseInt(filterBedrooms);
    const matchPriceMin = !filterPriceMin || p.price >= parseInt(filterPriceMin);
    const matchPriceMax = !filterPriceMax || p.price <= parseInt(filterPriceMax);
    const matchPermuta = !filterPermuta || p.acceptsExchange;
    const matchPagamento = !filterPagamento || !!p.paymentConditions;
    return matchSearch && matchCity && matchBedrooms && matchPriceMin && matchPriceMax && matchPermuta && matchPagamento;
  });

  // Segmentations
  const apartments = baseFiltered.filter((p) => p.type === "Apartamento");
  const houses = baseFiltered.filter((p) => p.type === "Casa");
  const lots = baseFiltered.filter((p) => p.type === "Terreno");
  const decorated = baseFiltered.filter((p) => p.decorated);
  const seaView = baseFiltered.filter((p) => p.seaView);
  const exchange = baseFiltered.filter((p) => p.acceptsExchange);
  const withPayment = baseFiltered.filter((p) => p.paymentConditions);

  // City groups
  const cities = [...new Set(brokerProperties.map((p) => p.city))];
  const byCityCapao = baseFiltered.filter((p) => p.city === "Capão da Canoa");
  const byCityXangrila = baseFiltered.filter((p) => p.city === "Xangri-lá");

  const whatsappGeneral = encodeURIComponent(
    `Olá ${brokerName}! Vi seu portfólio de imóveis e gostaria de mais informações.`
  );

  const totalValue = brokerProperties.reduce((sum, p) => sum + p.price, 0);

  const renderSection = (title: string, subtitle: string, icon: typeof Home, items: typeof baseFiltered) => {
    if (items.length === 0) return null;
    return (
      <section>
        <SectionHeader title={title} subtitle={subtitle} icon={icon} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((p) => (
            <PropertyCard key={p.id} property={p} whatsapp={info.whatsapp} brokerName={brokerName} />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/site" className="flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-extrabold text-gray-900">Imob<span className="text-amber-500">CRM</span></span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-600">
            {categories.slice(1).map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  "hover:text-amber-600 transition-colors",
                  activeCategory === cat.key && "text-amber-600 font-bold"
                )}
              >
                {cat.label}
              </button>
            ))}
          </nav>
          <a
            href={`https://wa.me/${info.whatsapp}?text=${whatsappGeneral}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm"
          >
            <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> Fale Comigo</span>
          </a>
        </div>
      </header>

      {/* Broker Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&h=600&fit=crop"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative">
              <img
                src={info.photo}
                alt={brokerName}
                className="w-36 h-36 rounded-full object-cover border-4 border-amber-400 shadow-2xl"
              />
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center border-3 border-white shadow-lg">
                <Star className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-center sm:text-left space-y-3 flex-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{brokerName}</h1>
              <p className="text-amber-400 font-bold text-sm tracking-wide">CRECI {info.creci}</p>
              <p className="text-gray-300 text-sm max-w-lg leading-relaxed">{info.bio}</p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-white font-extrabold text-lg leading-none">{brokerProperties.length}</p>
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider">Imóveis</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20">
                  <MapPin className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-white font-extrabold text-lg leading-none">{formatCurrency(totalValue)}</p>
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider">Em carteira</p>
                  </div>
                </div>
                <a
                  href={`https://wa.me/${info.whatsapp}?text=${whatsappGeneral}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-colors shadow-lg"
                >
                  <Phone className="w-4 h-4" /> WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Search + Quick Actions inside hero */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center bg-white rounded-2xl p-2 shadow-xl max-w-lg">
              <Search className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="Buscar imóvel por nome, endereço..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setActiveCategory("todos"); }}
                className="flex-1 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="p-1.5 rounded-lg hover:bg-gray-100 mr-1">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 text-white text-sm font-bold hover:bg-white/30 transition-colors backdrop-blur-sm border border-white/30"
              >
                <SlidersHorizontal className="w-4 h-4" /> Filtros Avançados
                <ChevronDown className={cn("w-4 h-4 transition-transform", showFilters && "rotate-180")} />
              </button>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-300">
              <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-amber-400" /> {apartments.length} Aptos</span>
              <span className="flex items-center gap-1.5"><Home className="w-4 h-4 text-amber-400" /> {houses.length} Casas</span>
              <span className="flex items-center gap-1.5"><TreePine className="w-4 h-4 text-amber-400" /> {lots.length} Terrenos</span>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 shadow-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Cidade</label>
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Todas</option>
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Quartos (mín.)</label>
                <select
                  value={filterBedrooms}
                  onChange={(e) => setFilterBedrooms(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Qualquer</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Preço mín.</label>
                <select
                  value={filterPriceMin}
                  onChange={(e) => setFilterPriceMin(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Sem mínimo</option>
                  <option value="200000">R$ 200 mil</option>
                  <option value="500000">R$ 500 mil</option>
                  <option value="800000">R$ 800 mil</option>
                  <option value="1000000">R$ 1 milhão</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Preço máx.</label>
                <select
                  value={filterPriceMax}
                  onChange={(e) => setFilterPriceMax(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Sem máximo</option>
                  <option value="500000">R$ 500 mil</option>
                  <option value="800000">R$ 800 mil</option>
                  <option value="1000000">R$ 1 milhão</option>
                  <option value="1500000">R$ 1,5 milhão</option>
                  <option value="2000000">R$ 2 milhões</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => { setFilterPermuta(!filterPermuta); setActiveCategory("todos"); }}
                  className={cn(
                    "w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-colors",
                    filterPermuta
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600 border border-gray-200"
                  )}
                >
                  <Repeat className="w-3.5 h-3.5" /> Permuta
                </button>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => { setFilterPagamento(!filterPagamento); setActiveCategory("todos"); }}
                  className={cn(
                    "w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-colors",
                    filterPagamento
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 border border-gray-200"
                  )}
                >
                  <CreditCard className="w-3.5 h-3.5" /> Pagamento
                </button>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={() => { setActiveCategory("todos"); setShowFilters(false); }}
                  className="flex-1 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors"
                >
                  Buscar
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter Mobile */}
      <div className="md:hidden sticky top-16 z-40 bg-white border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-1 p-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                activeCategory === cat.key
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <cat.icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Properties */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* Search results */}
        {(searchTerm || hasActiveFilters) && (
          <section>
            <SectionHeader
              title={searchTerm ? `Resultados para "${searchTerm}"` : "Resultados dos Filtros"}
              subtitle={`${baseFiltered.length} imóveis encontrados`}
              icon={Search}
            />
            {baseFiltered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {baseFiltered.map((p) => (
                  <PropertyCard key={p.id} property={p} whatsapp={info.whatsapp} brokerName={brokerName} />
                ))}
              </div>
            ) : (
              <p className="text-center py-12 text-gray-400">Nenhum imóvel encontrado.</p>
            )}
          </section>
        )}

        {/* Category-based sections */}
        {!searchTerm && !hasActiveFilters && (
          <>
            {/* TODOS - show by city */}
            {activeCategory === "todos" && (
              <>
                {/* Capão da Canoa */}
                {byCityCapao.length > 0 && (
                  <section>
                    <SectionHeader title="Capão da Canoa" subtitle={`${byCityCapao.length} imóveis em Capão da Canoa`} icon={MapPin} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {byCityCapao.map((p) => (
                        <PropertyCard key={p.id} property={p} whatsapp={info.whatsapp} brokerName={brokerName} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Xangri-lá */}
                {byCityXangrila.length > 0 && (
                  <section>
                    <SectionHeader title="Xangri-lá" subtitle={`${byCityXangrila.length} imóveis em Xangri-lá`} icon={MapPin} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {byCityXangrila.map((p) => (
                        <PropertyCard key={p.id} property={p} whatsapp={info.whatsapp} brokerName={brokerName} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {/* Apartamentos */}
            {activeCategory === "apartamentos" && renderSection("Apartamentos", `${apartments.length} apartamentos`, Building2, apartments)}

            {/* Casas */}
            {activeCategory === "casas" && renderSection("Casas", `${houses.length} casas`, Home, houses)}

            {/* Terrenos */}
            {activeCategory === "terrenos" && renderSection("Terrenos", `${lots.length} terrenos`, TreePine, lots)}

            {/* Decorados */}
            {activeCategory === "decorados" && renderSection("Decorados", `${decorated.length} imóveis decorados`, Paintbrush, decorated)}

            {/* Vista Mar */}
            {activeCategory === "vista-mar" && renderSection("Vista para o Mar", `${seaView.length} imóveis com vista mar`, Waves, seaView)}

            {/* Permuta */}
            {activeCategory === "permuta" && renderSection("Aceita Permuta", `${exchange.length} imóveis que aceitam permuta`, Repeat, exchange)}

            {/* Pagamento */}
            {activeCategory === "pagamento" && renderSection("Condições de Pagamento", `${withPayment.length} imóveis com condições especiais`, CreditCard, withPayment)}
          </>
        )}

        {/* Empty state */}
        {brokerProperties.length === 0 && (
          <p className="text-center py-16 text-gray-400 text-lg">
            Nenhum imóvel disponível no momento.
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-extrabold text-white">
              Imob<span className="text-amber-400">CRM</span>
            </span>
          </div>
          <p className="text-sm">{brokerName} — CRECI {info.creci}</p>
          <div className="flex items-center justify-center gap-4">
            <a
              href={`https://wa.me/${info.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors"
            >
              <Phone className="w-4 h-4" /> WhatsApp
            </a>
          </div>
          <p className="text-xs text-gray-600 pt-4">© 2024 ImobCRM. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
