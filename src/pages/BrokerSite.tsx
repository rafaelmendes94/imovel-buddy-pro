import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { properties, formatCurrency, type Property } from "@/data/mockData";
import { PropertyDetailModal } from "@/components/PropertyDetailModal";
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
  DollarSign,
  Clock,
  FileCheck,
  Eye,
  ShieldCheck,
  MessageSquare,
  Send,
  ThumbsUp,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SiteConfigDialog } from "@/components/SiteConfigDialog";

const brokerInfo: Record<string, { photo: string; whatsapp: string; creci: string; bio: string; totalSold: number; totalSoldValue: number; avgDaysToSell: number; rating: number; totalRatings: number; comments: { author: string; avatar: string; rating: number; text: string; date: string }[] }> = {
  "Carlos Silva": {
    photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face",
    whatsapp: "5511999990001",
    creci: "123456-RS",
    bio: "Especialista em imóveis de alto padrão no litoral norte gaúcho. Mais de 10 anos de experiência no mercado imobiliário.",
    totalSold: 24,
    totalSoldValue: 8500000,
    avgDaysToSell: 45,
    rating: 4.7,
    totalRatings: 18,
    comments: [
      { author: "Ricardo Mendes", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face", rating: 5, text: "Excelente corretor! Me ajudou a encontrar o imóvel perfeito. Muito profissional e atencioso.", date: "2024-03-12" },
      { author: "Juliana Costa", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face", rating: 5, text: "Vendeu meu apartamento em tempo recorde! Super recomendo.", date: "2024-02-28" },
      { author: "Fernando Lopes", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face", rating: 4, text: "Bom atendimento e conhecimento do mercado local.", date: "2024-01-15" },
    ],
  },
  "Ana Rodrigues": {
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face",
    whatsapp: "5511999990002",
    creci: "234567-RS",
    bio: "Corretora dedicada com foco em lotes e terrenos. Atendimento personalizado para encontrar o melhor investimento.",
    totalSold: 18,
    totalSoldValue: 6200000,
    avgDaysToSell: 38,
    rating: 4.9,
    totalRatings: 14,
    comments: [
      { author: "Carla Souza", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face", rating: 5, text: "Ana é incrível! Muito dedicada e encontrou exatamente o que eu procurava.", date: "2024-03-05" },
      { author: "Paulo Henrique", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face", rating: 5, text: "Profissional exemplar, fechamos negócio muito rápido.", date: "2024-02-10" },
    ],
  },
  "Marcos Oliveira": {
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    whatsapp: "5511999990003",
    creci: "345678-RS",
    bio: "Consultor imobiliário com amplo conhecimento do mercado de Capão da Canoa e Xangri-lá. Foco em resultados.",
    totalSold: 31,
    totalSoldValue: 12100000,
    avgDaysToSell: 32,
    rating: 4.5,
    totalRatings: 22,
    comments: [
      { author: "Tatiane Reis", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face", rating: 5, text: "Marcos é muito experiente, conhece cada canto da região!", date: "2024-03-18" },
    ],
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
    paymentConditions: ["48x", "Permuta"],
    empreendimento: "Ed. Navegantes",
    unitNumber: "Ap 501",
    boxNumber: "Box 15",
    exclusivityTerm: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=1100&fit=crop",
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
    paymentConditions: ["24x", "Permuta"],
    empreendimento: "Cond. Reserva do Litoral",
    quadra: "Q-08",
    lote: "L-22",
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
    paymentConditions: ["72x"],
    empreendimento: "Cond. Praia das Dunas",
    quadra: "Q-02",
    lote: "L-11",
    exclusivityTerm: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=1100&fit=crop",
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
    paymentConditions: ["36x", "Carro"],
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
    paymentConditions: ["60x", "Permuta"],
    empreendimento: "Ed. Alto Padrão Atlântida",
    unitNumber: "Ap 801",
    boxNumber: "Box 25, 26",
  },
  {
    id: "sold-1",
    title: "Cobertura Vista Mar Vendida",
    address: "Av. Beira Mar, 900",
    city: "Capão da Canoa",
    type: "Apartamento" as const,
    status: "Vendido" as const,
    price: 1650000,
    area: 200,
    bedrooms: 3,
    bathrooms: 3,
    parking: 2,
    broker: "Ana Rodrigues",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop",
    images: [],
    createdAt: "2024-01-10",
    lat: -29.745,
    lng: -50.103,
    decorated: true,
    seaView: true,
    acceptsExchange: false,
    paymentConditions: ["84x"],
    empreendimento: "Ed. Atlântico Sul",
    unitNumber: "Cobertura 02",
    boxNumber: "Box 04, 05",
  },
  {
    id: "sold-2",
    title: "Casa Condomínio Vendida",
    address: "Rua das Palmeiras, 200",
    city: "Xangri-lá",
    type: "Casa" as const,
    status: "Vendido" as const,
    price: 980000,
    area: 220,
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
    broker: "Carlos Silva",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop",
    images: [],
    createdAt: "2024-02-05",
    lat: -29.800,
    lng: -50.055,
    decorated: false,
    seaView: false,
    acceptsExchange: false,
    paymentConditions: ["48x"],
    empreendimento: "Cond. Reserva das Dunas",
    quadra: "Q-03",
    lote: "L-12",
  },
  {
    id: "sold-3",
    title: "Apartamento Atlântida Vendido",
    address: "Av. Central, 350",
    city: "Xangri-lá",
    type: "Apartamento" as const,
    status: "Vendido" as const,
    price: 720000,
    area: 85,
    bedrooms: 2,
    bathrooms: 1,
    parking: 1,
    broker: "Marcos Oliveira",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop",
    images: [],
    createdAt: "2024-02-20",
    lat: -29.788,
    lng: -50.068,
    decorated: false,
    seaView: true,
    acceptsExchange: false,
    paymentConditions: ["72x"],
    empreendimento: "Residencial Atlântida",
    unitNumber: "Ap 205",
    boxNumber: "Box 10",
  },
  {
    id: "sold-4",
    title: "Lote Bosque Vendido",
    address: "Rua dos Coqueiros, 180",
    city: "Xangri-lá",
    type: "Terreno" as const,
    status: "Vendido" as const,
    price: 350000,
    area: 480,
    bedrooms: 0,
    bathrooms: 0,
    parking: 0,
    broker: "Ana Rodrigues",
    image: "https://images.unsplash.com/photo-1500076656116-558758c991c1?w=600&h=400&fit=crop",
    images: [],
    createdAt: "2024-03-01",
    lat: -29.812,
    lng: -50.043,
    decorated: false,
    seaView: false,
    acceptsExchange: false,
    paymentConditions: ["24x"],
    empreendimento: "Cond. Bosque do Litoral",
    quadra: "Q-10",
    lote: "L-15",
  },
];

type Category = "todos" | "apartamentos" | "casas" | "terrenos" | "decorados" | "vista-mar";

const categories: { key: Category; label: string; icon: typeof Home }[] = [
  { key: "todos", label: "Todos", icon: Home },
  { key: "apartamentos", label: "Apartamentos", icon: Building2 },
  { key: "casas", label: "Casas", icon: Home },
  { key: "terrenos", label: "Terrenos", icon: TreePine },
  { key: "decorados", label: "Decorados", icon: Paintbrush },
  { key: "vista-mar", label: "Vista Mar", icon: Waves },
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

function PropertyCard({ property, whatsapp, brokerName, onSelect, onViewTerm }: { property: typeof allSiteProperties[0]; whatsapp: string; brokerName: string; onSelect?: (p: typeof allSiteProperties[0]) => void; onViewTerm?: (url: string) => void }) {
  const whatsappMessage = encodeURIComponent(
    `Olá ${brokerName}! Tenho interesse no imóvel: ${property.title} - ${formatCurrency(property.price)}`
  );
  const unitParts = [property.unitNumber, property.boxNumber, property.quadra, property.lote].filter(Boolean);

  return (
    <div className="group rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100">
      <div className="relative h-52 overflow-hidden cursor-pointer" onClick={() => onSelect?.(property)}>
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white uppercase tracking-wide">
          {property.status}
        </span>
        {property.exclusivityTerm && (
          <button
            onClick={(e) => { e.stopPropagation(); onViewTerm?.(property.exclusivityTerm!); }}
            className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-amber-500/90 text-white backdrop-blur-sm hover:bg-amber-600 transition-colors"
            title="Ver termo de exclusividade"
          >
            <FileCheck className="w-3 h-3" /> Exclusivo
          </button>
        )}
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
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-xl font-bold text-white drop-shadow-lg">
            {formatCurrency(property.price)}
          </p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <h3 className="font-bold text-gray-900 text-base leading-tight cursor-pointer hover:text-amber-700 transition-colors" onClick={() => onSelect?.(property)}>{property.title}</h3>
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
              <span key={part} className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                {part}
              </span>
            ))}
          </div>
        )}
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
        {property.paymentConditions && property.paymentConditions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {property.paymentConditions.map((cond) => (
              <span key={cond} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700">
                {cond}
              </span>
            ))}
            {property.paymentConditionsOther && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600">
                {property.paymentConditionsOther}
              </span>
            )}
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
  const soldProperties = allSiteProperties.filter(
    (p) => p.broker === brokerName && (p.status === "Vendido" || p.status === "Reservado")
  );
  const soldValue = soldProperties.reduce((sum, p) => sum + p.price, 0);

  const [activeCategory, setActiveCategory] = useState<Category>("todos");
  const [filterCity, setFilterCity] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterBedrooms, setFilterBedrooms] = useState("");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [filterCondition, setFilterCondition] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [viewingTerm, setViewingTerm] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [localComments, setLocalComments] = useState<{ author: string; avatar: string; rating: number; text: string; date: string }[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Auto-scroll carousel for sold properties
  const soldForCarousel = allSiteProperties.filter(
    (p) => p.broker === (slug ? slug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "") && (p.status === "Vendido" || p.status === "Reservado")
  );

  useEffect(() => {
    if (soldForCarousel.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % soldForCarousel.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [soldForCarousel.length]);

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

  const hasActiveFilters = filterCity || filterBedrooms || filterPriceMin || filterPriceMax || filterCondition;

  const clearFilters = () => {
    setFilterCity("");
    setFilterBedrooms("");
    setFilterPriceMin("");
    setFilterPriceMax("");
    setFilterCondition("");
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
    const matchCondition = !filterCondition || (
      Array.isArray(p.paymentConditions) && p.paymentConditions.some(c => c.toLowerCase().includes(filterCondition.toLowerCase()))
    );
    return matchSearch && matchCity && matchBedrooms && matchPriceMin && matchPriceMax && matchCondition;
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
            <PropertyCard key={p.id} property={p} whatsapp={info.whatsapp} brokerName={brokerName} onSelect={setSelectedProperty} onViewTerm={setViewingTerm} />
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
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-white font-extrabold text-lg leading-none">{brokerProperties.length}</p>
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider">Em Carteira</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20">
                  <MapPin className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-white font-extrabold text-lg leading-none">{formatCurrency(totalValue)}</p>
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider">VGV em carteira</p>
                  </div>
                </div>
                {/* Total Sales - next to VGV carteira */}
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-white font-extrabold text-lg leading-none">{formatCurrency(info.totalSoldValue)}</p>
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider">VGV vendido ({info.totalSold})</p>
                  </div>
                </div>
                {/* Star Rating */}
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          "w-4 h-4",
                          s <= Math.round(info.rating) ? "text-amber-400 fill-amber-400" : "text-gray-500"
                        )}
                      />
                    ))}
                  </div>
                  <div>
                    <p className="text-white font-extrabold text-lg leading-none">{info.rating}</p>
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider">{info.totalRatings} avaliações</p>
                  </div>
                </button>
                {/* Avg Days */}
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-white font-extrabold text-lg leading-none">{info.avgDaysToSell} dias</p>
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider">Média de venda</p>
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
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Condições</label>
                <select
                  value={filterCondition}
                  onChange={(e) => setFilterCondition(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Todas</option>
                  <option value="12x">12x</option>
                  <option value="24x">24x</option>
                  <option value="36x">36x</option>
                  <option value="48x">48x</option>
                  <option value="60x">60x</option>
                  <option value="72x">72x</option>
                  <option value="84x">84x</option>
                  <option value="100x">100x</option>
                  <option value="Permuta">Permuta</option>
                  <option value="Carro">Carro</option>
                </select>
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
                  <PropertyCard key={p.id} property={p} whatsapp={info.whatsapp} brokerName={brokerName} onSelect={setSelectedProperty} onViewTerm={setViewingTerm} />
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
                        <PropertyCard key={p.id} property={p} whatsapp={info.whatsapp} brokerName={brokerName} onSelect={setSelectedProperty} onViewTerm={setViewingTerm} />
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
                        <PropertyCard key={p.id} property={p} whatsapp={info.whatsapp} brokerName={brokerName} onSelect={setSelectedProperty} onViewTerm={setViewingTerm} />
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
          </>
        )}

        {/* Últimas Vendas Carousel */}
        {!searchTerm && !hasActiveFilters && soldProperties.length > 0 && activeCategory === "todos" && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center shadow-md">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">
                  Últimas Vendas — {formatCurrency(soldValue)}
                </h2>
                <p className="text-sm text-gray-500">{soldProperties.length} imóveis vendidos</p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl bg-gray-900 shadow-xl">
              <div
                ref={carouselRef}
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
              >
                {soldProperties.map((p) => (
                  <div key={p.id} className="min-w-full flex flex-col sm:flex-row">
                    <div className="relative sm:w-1/2 h-56 sm:h-72 overflow-hidden">
                      <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-900/50 hidden sm:block" />
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold bg-red-500 text-white uppercase tracking-wide">
                        Vendido
                      </span>
                    </div>
                    <div className="sm:w-1/2 p-6 flex flex-col justify-center text-white space-y-3">
                      <h3 className="text-xl font-bold">{p.title}</h3>
                      {p.empreendimento && (
                        <p className="text-amber-400 text-sm font-semibold">
                          {p.empreendimento}
                          {p.unitNumber && <span className="text-gray-400 ml-2">{p.unitNumber}</span>}
                          {p.quadra && <span className="text-gray-400 ml-2">{p.quadra}</span>}
                          {p.lote && <span className="text-gray-400 ml-1">{p.lote}</span>}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>{p.address}, {p.city}</span>
                      </div>
                      <p className="text-2xl font-black text-emerald-400">{formatCurrency(p.price)}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        {p.area > 0 && <span>{p.area}m²</span>}
                        {p.bedrooms > 0 && <span>{p.bedrooms} quartos</span>}
                        {p.bathrooms > 0 && <span>{p.bathrooms} ban.</span>}
                        {p.parking > 0 && <span>{p.parking} vagas</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {soldProperties.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  {soldProperties.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCarouselIndex(i)}
                      className={cn(
                        "w-2.5 h-2.5 rounded-full transition-colors",
                        i === carouselIndex ? "bg-amber-400" : "bg-white/30"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {brokerProperties.length === 0 && (
          <p className="text-center py-16 text-gray-400 text-lg">
            Nenhum imóvel disponível no momento.
          </p>
        )}
      </main>

      {/* Avaliações e Comentários Section */}
      {info && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" /> Avaliações e Comentários
              </h2>
              <button
                onClick={() => setShowRatingModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors flex items-center gap-2"
              >
                <Star className="w-4 h-4" /> Avaliar Corretor
              </button>
            </div>

            {/* Rating overview */}
            {(() => {
              const allComments = [...(info.comments || []), ...localComments];
              const avgRating = allComments.length > 0
                ? (allComments.reduce((s, c) => s + c.rating, 0) / allComments.length).toFixed(1)
                : info.rating.toFixed(1);
              return (
                <>
                  <div className="flex items-center gap-6 mb-6 p-4 bg-amber-50 rounded-xl">
                    <div className="text-center">
                      <p className="text-4xl font-black text-amber-600">{avgRating}</p>
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn("w-4 h-4", s <= Math.round(Number(avgRating)) ? "text-amber-400 fill-amber-400" : "text-gray-300")} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{info.totalRatings + localComments.length} avaliações</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = allComments.filter(c => c.rating === star).length;
                        const pct = allComments.length > 0 ? (count / allComments.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="w-3 text-gray-500">{star}</span>
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-6 text-right text-gray-400">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {submitted && (
                    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4" /> Sua avaliação foi enviada com sucesso!
                    </div>
                  )}

                  {allComments.length > 0 ? (
                    <div className="space-y-4">
                      {allComments.map((c, i) => (
                        <div key={i} className="flex gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <img src={c.avatar} alt={c.author} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold text-gray-900">{c.author}</p>
                              <p className="text-[10px] text-gray-400">{c.date}</p>
                            </div>
                            <div className="flex items-center gap-0.5 mt-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className={cn("w-3 h-3", s <= c.rating ? "text-amber-400 fill-amber-400" : "text-gray-300")} />
                              ))}
                            </div>
                            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{c.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-gray-400 text-sm">Nenhum comentário ainda. Seja o primeiro a avaliar!</p>
                  )}
                </>
              );
            })()}
          </div>
        </section>
      )}

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
          <p className="text-xs text-gray-600 pt-4">© 2024 MV BROKER CONNECT. Todos os direitos reservados.</p>
        </div>
      </footer>
      <PropertyDetailModal
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
        allProperties={allSiteProperties}
        brokerInfo={Object.fromEntries(
          Object.entries({ [brokerName]: { photo: info.photo, whatsapp: info.whatsapp } })
        )}
        onSelectSimilar={(p) => setSelectedProperty(p)}
      />

      {/* Rating + Comment Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRatingModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Avaliar {brokerName}</h3>
              <button onClick={() => setShowRatingModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-500">Como você avalia este corretor?</p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setUserRating(s)}
                    className="p-1 transition-transform hover:scale-125"
                  >
                    <Star
                      className={cn(
                        "w-8 h-8 transition-colors",
                        s <= (hoverRating || userRating) ? "text-amber-400 fill-amber-400" : "text-gray-300"
                      )}
                    />
                  </button>
                ))}
              </div>
              {userRating > 0 && (
                <p className="text-sm font-semibold text-amber-600">
                  Você deu {userRating} estrela{userRating > 1 ? "s" : ""}!
                </p>
              )}
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Seu nome"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50"
              />
              <textarea
                placeholder="Deixe seu comentário sobre este corretor..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50 resize-none"
              />
            </div>
            <button
              disabled={userRating === 0 || !commentText.trim() || !authorName.trim()}
              onClick={() => {
                if (userRating === 0 || !commentText.trim() || !authorName.trim()) return;
                setLocalComments(prev => [...prev, {
                  author: authorName,
                  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=f59e0b&color=fff`,
                  rating: userRating,
                  text: commentText,
                  date: new Date().toISOString().split("T")[0],
                }]);
                setSubmitted(true);
                setShowRatingModal(false);
                setCommentText("");
                setAuthorName("");
                setUserRating(0);
              }}
              className={cn(
                "w-full py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2",
                userRating > 0 && commentText.trim() && authorName.trim()
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" /> Enviar Avaliação
            </button>
          </div>
        </div>
      )}



      {/* Term Viewer Modal */}
      {viewingTerm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingTerm(null)}>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-gray-900">Termo de Exclusividade</h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={viewingTerm}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> Abrir original
                </a>
                <button onClick={() => setViewingTerm(null)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="overflow-auto max-h-[calc(90vh-60px)] p-4 bg-gray-50 flex items-center justify-center">
              {viewingTerm.toLowerCase().endsWith(".pdf") ? (
                <iframe src={viewingTerm} className="w-full h-[75vh] rounded-lg border border-gray-200" title="Termo de Exclusividade" />
              ) : (
                <img src={viewingTerm} alt="Termo de Exclusividade" className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-md" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
