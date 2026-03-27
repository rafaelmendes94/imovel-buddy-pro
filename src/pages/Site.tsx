import { useState, useEffect, useRef } from "react";
import { properties, formatCurrency } from "@/data/mockData";
import {
  Search,
  MapPin,
  BedDouble,
  Bath,
  Car,
  Ruler,
  Phone,
  Mail,
  ChevronRight,
  Star,
  Building2,
  Fence,
  Home,
  TreePine,
  ArrowUp,
  Filter,
  X,
  Waves,
  Paintbrush,
  Repeat,
  CreditCard,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Broker info map
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

// Extended mock data for the public site
const siteProperties = [
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
    id: "site-4",
    title: "Lote Residencial Capão Novo",
    address: "Rua das Gaivotas, 80",
    city: "Capão da Canoa",
    type: "Terreno" as const,
    status: "Disponível" as const,
    price: 190000,
    area: 360,
    bedrooms: 0,
    bathrooms: 0,
    parking: 0,
    broker: "Ana Rodrigues",
    image: "https://images.unsplash.com/photo-1500076656116-558758c991c1?w=600&h=400&fit=crop",
    images: [],
    createdAt: "2024-03-10",
    lat: -29.7600,
    lng: -50.0900,
    decorated: false,
    seaView: false,
    acceptsExchange: false,
    paymentConditions: "Entrada + 36x direto",
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

const condoProperties = [
  {
    id: "condo-1",
    name: "Condomínio Praia Dourada",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop",
    city: "Capão da Canoa",
    units: 120,
    available: 18,
    monthlyFee: 800,
    type: "Horizontal",
  },
  {
    id: "condo-2",
    name: "Residencial Atlântida Sul",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop",
    city: "Xangri-lá",
    units: 80,
    available: 12,
    monthlyFee: 1200,
    type: "Vertical",
  },
  {
    id: "condo-3",
    name: "Village das Dunas",
    image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&h=400&fit=crop",
    city: "Xangri-lá",
    units: 60,
    available: 22,
    monthlyFee: 650,
    type: "Horizontal",
  },
];

const available = siteProperties.filter((p) => p.status === "Disponível");
const featured = available.slice(0, 3);
const apartments = available.filter((p) => p.type === "Apartamento");
const houses = available.filter((p) => p.type === "Casa");
const lots = available.filter((p) => p.type === "Terreno");
const decorated = available.filter((p) => p.decorated);
const seaViewProperties = available.filter((p) => p.seaView);
const exchangeProperties = available.filter((p) => p.acceptsExchange);
const withPaymentConditions = available.filter((p) => p.paymentConditions);

// Separate lots into condo lots vs neighborhood lots
const condoLots = lots.filter((l) => l.title.toLowerCase().includes("condomínio") || l.title.toLowerCase().includes("reserva"));
const neighborhoodLots = lots.filter((l) => !l.title.toLowerCase().includes("condomínio") && !l.title.toLowerCase().includes("reserva"));

type Category = "todos" | "destaque" | "apartamentos" | "condominios" | "casas" | "lotes-cond" | "lotes-bairro" | "decorados" | "vista-mar" | "permuta" | "pagamento";

const categories: { key: Category; label: string; icon: typeof Home }[] = [
  { key: "todos", label: "Todos", icon: Search },
  { key: "destaque", label: "Destaques", icon: Star },
  { key: "apartamentos", label: "Apartamentos", icon: Building2 },
  { key: "condominios", label: "Condomínios", icon: Fence },
  { key: "casas", label: "Casas", icon: Home },
  { key: "decorados", label: "Decorados", icon: Paintbrush },
  { key: "vista-mar", label: "Vista Mar", icon: Waves },
  { key: "lotes-cond", label: "Lotes Condomínio", icon: TreePine },
  { key: "lotes-bairro", label: "Lotes Bairro", icon: MapPin },
  { key: "permuta", label: "Permuta", icon: Repeat },
  { key: "pagamento", label: "Condições", icon: CreditCard },
];

function PropertyCard({ property }: { property: typeof siteProperties[0] }) {
  const broker = brokerInfo[property.broker] || { photo: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop&crop=face", whatsapp: "5511999999999" };
  const whatsappMessage = encodeURIComponent(`Olá! Tenho interesse no imóvel: ${property.title} - ${formatCurrency(property.price)}`);

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
        <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/90 text-gray-800 backdrop-blur-sm">
          {property.type}
        </span>
        {/* Feature badges */}
        <div className="absolute bottom-12 left-3 flex gap-1.5">
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
          <p className="text-xl font-bold text-white drop-shadow-lg">{formatCurrency(property.price)}</p>
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

        {/* Broker info + WhatsApp */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <img
              src={broker.photo}
              alt={property.broker}
              className="w-8 h-8 rounded-full object-cover border-2 border-amber-400"
            />
            <div>
              <p className="text-xs font-semibold text-gray-800 leading-tight">{property.broker}</p>
              <p className="text-[10px] text-gray-400">Corretor(a)</p>
            </div>
          </div>
          <a
            href={`https://wa.me/${broker.whatsapp}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm"
          >
            <Phone className="w-3.5 h-3.5" />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

function CondoCard({ condo }: { condo: typeof condoProperties[0] }) {
  return (
    <div className="group rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100">
      <div className="relative h-48 overflow-hidden">
        <img src={condo.image} alt={condo.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500 text-white">{condo.type}</span>
        <div className="absolute bottom-3 left-3">
          <p className="text-lg font-bold text-white drop-shadow-lg">{condo.name}</p>
          <p className="text-xs text-white/80">{condo.city}</p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{condo.units} unidades</span>
          <span className="font-bold text-emerald-600">{condo.available} disponíveis</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Condomínio</span>
          <span className="font-bold text-gray-900">{formatCurrency(condo.monthlyFee)}/mês</span>
        </div>
        <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-bold hover:from-indigo-700 hover:to-indigo-600 transition-all shadow-sm">
          Ver Unidades
        </button>
      </div>
    </div>
  );
}
function SiteMap({ properties: mapProperties }: { properties: typeof siteProperties }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedProperty, setSelectedProperty] = useState<typeof siteProperties[0] | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initMap = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        zoomControl: false,
      }).setView([-29.77, -50.08], 12);
      mapInstanceRef.current = map;

      // Zoom control on the right
      L.control.zoom({ position: "topright" }).addTo(map);

      // Realistic satellite-style tile layer
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: '&copy; Esri, Maxar, Earthstar Geographics',
        maxZoom: 19,
      }).addTo(map);

      // Street labels overlay on top of satellite
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19,
      }).addTo(map);

      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19,
      }).addTo(map);

      // Custom icon based on property type
      const getIcon = (type: string) => {
        const colors: Record<string, string> = {
          Apartamento: "#f59e0b",
          Casa: "#3b82f6",
          Terreno: "#22c55e",
          Comercial: "#8b5cf6",
        };
        const color = colors[type] || "#f59e0b";

        return L.divIcon({
          className: "custom-marker",
          html: `<div style="
            width: 36px; height: 36px; 
            background: ${color}; 
            border: 3px solid white; 
            border-radius: 50%; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            display: flex; align-items: center; justify-content: center;
            color: white; font-weight: 800; font-size: 13px;
            cursor: pointer;
            transition: transform 0.2s;
          ">
            <span style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));">
              ${type === "Apartamento" ? "🏢" : type === "Casa" ? "🏠" : type === "Terreno" ? "🌳" : "🏬"}
            </span>
          </div>
          <div style="
            width: 12px; height: 12px; 
            background: ${color}; 
            transform: rotate(45deg); 
            margin: -7px auto 0; 
            box-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          "></div>`,
          iconSize: [36, 48],
          iconAnchor: [18, 48],
          popupAnchor: [0, -48],
        });
      };

      mapProperties.forEach((p) => {
        if (!p.lat || !p.lng) return;

        const broker = brokerInfo[p.broker] || { photo: "", whatsapp: "5511999999999" };
        const whatsMsg = encodeURIComponent(`Olá! Tenho interesse no imóvel: ${p.title}`);

        const popup = L.popup({
          maxWidth: 280,
          className: "custom-popup",
        }).setContent(`
          <div style="font-family: system-ui, -apple-system, sans-serif; margin: -4px;">
            <img src="${p.image}" alt="${p.title}" style="width:100%; height:120px; object-fit:cover; border-radius:8px 8px 0 0; margin-bottom:8px;" />
            <div style="padding: 0 4px 4px;">
              <h3 style="font-size:14px; font-weight:700; color:#1a1a1a; margin:0 0 4px;">${p.title}</h3>
              <p style="font-size:11px; color:#666; margin:0 0 6px;">📍 ${p.address}, ${p.city}</p>
              <p style="font-size:18px; font-weight:800; color:#f59e0b; margin:0 0 8px;">${formatCurrency(p.price)}</p>
              <div style="display:flex; gap:12px; font-size:11px; color:#888; margin-bottom:10px;">
                ${p.area > 0 ? `<span>📐 ${p.area}m²</span>` : ""}
                ${p.bedrooms > 0 ? `<span>🛏 ${p.bedrooms} qts</span>` : ""}
                ${p.parking > 0 ? `<span>🚗 ${p.parking} vg</span>` : ""}
              </div>
              <div style="display:flex; align-items:center; justify-content:space-between; padding-top:8px; border-top:1px solid #eee;">
                <div style="display:flex; align-items:center; gap:6px;">
                  ${broker.photo ? `<img src="${broker.photo}" style="width:28px; height:28px; border-radius:50%; object-fit:cover; border:2px solid #f59e0b;" />` : ""}
                  <span style="font-size:11px; font-weight:600; color:#333;">${p.broker}</span>
                </div>
                <a href="https://wa.me/${broker.whatsapp}?text=${whatsMsg}" target="_blank" rel="noopener noreferrer" 
                   style="display:inline-flex; align-items:center; gap:4px; padding:5px 10px; background:#22c55e; color:white; border-radius:8px; font-size:11px; font-weight:700; text-decoration:none;">
                  📱 WhatsApp
                </a>
              </div>
            </div>
          </div>
        `);

        L.marker([p.lat, p.lng], { icon: getIcon(p.type) })
          .addTo(map)
          .bindPopup(popup);
      });

      // Fit bounds to all markers
      const validProps = mapProperties.filter((p) => p.lat && p.lng);
      if (validProps.length > 1) {
        const bounds = L.latLngBounds(validProps.map((p) => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    };

    const L = (window as any).L;
    if (L) {
      initMap();
    } else {
      const existingLink = document.querySelector('link[href*="leaflet"]');
      if (!existingLink) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      const existingScript = document.querySelector('script[src*="leaflet"]');
      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = initMap;
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener("load", initMap);
        setTimeout(initMap, 200);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapProperties]);

  return (
    <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 relative">
      {/* Map legend */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-lg border border-gray-100">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Legenda</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded-full bg-amber-500" /> Apartamento</div>
          <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded-full bg-blue-500" /> Casa</div>
          <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Terreno</div>
          <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded-full bg-violet-500" /> Comercial</div>
        </div>
      </div>
      <div ref={mapRef} style={{ height: "500px", width: "100%" }} />
    </div>
  );
}

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

export default function Site() {
  const [activeCategory, setActiveCategory] = useState<Category>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setShowScrollTop(e.currentTarget.scrollTop > 400);
  };

  const scrollToTop = () => {
    document.getElementById("site-top")?.scrollIntoView({ behavior: "smooth" });
  };

  const filteredAll = available.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans" onScroll={handleScroll}>
      <div id="site-top" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-gray-900">Imob<span className="text-amber-500">CRM</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
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
          <div className="flex items-center gap-3">
            <a href="tel:+5511999999999" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-amber-600 transition-colors">
              <Phone className="w-4 h-4" /> (11) 99999-9999
            </a>
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&h=800&fit=crop"
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/60 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Encontre o imóvel dos seus <span className="text-amber-400">sonhos</span>
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed">
              Apartamentos, casas, condomínios e lotes nas melhores localizações. Seu novo lar está aqui.
            </p>
            <div className="flex items-center bg-white rounded-2xl p-2 shadow-xl max-w-lg">
              <Search className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="Buscar por nome, endereço ou cidade..."
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
            <div className="flex items-center gap-6 text-sm text-gray-300">
              <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-amber-400" /> {apartments.length} Apartamentos</span>
              <span className="flex items-center gap-1.5"><Home className="w-4 h-4 text-amber-400" /> {houses.length} Casas</span>
              <span className="flex items-center gap-1.5"><TreePine className="w-4 h-4 text-amber-400" /> {lots.length} Lotes</span>
            </div>
          </div>
        </div>
      </section>

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* Search results */}
        {searchTerm && (
          <section>
            <SectionHeader title={`Resultados para "${searchTerm}"`} subtitle={`${filteredAll.length} imóveis encontrados`} icon={Search} />
            {filteredAll.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAll.map((p) => <PropertyCard key={p.id} property={p} />)}
              </div>
            ) : (
              <p className="text-center py-12 text-gray-400">Nenhum imóvel encontrado para esta busca.</p>
            )}
          </section>
        )}

        {/* Destaques */}
        {!searchTerm && (activeCategory === "todos" || activeCategory === "destaque") && (
          <section>
            <SectionHeader title="Imóveis em Destaque" subtitle="Seleção especial dos melhores imóveis" icon={Star} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>
          </section>
        )}

        {/* Apartamentos */}
        {!searchTerm && (activeCategory === "todos" || activeCategory === "apartamentos") && apartments.length > 0 && (
          <section>
            <SectionHeader title="Apartamentos" subtitle={`${apartments.length} apartamentos disponíveis`} icon={Building2} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {apartments.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>
          </section>
        )}

        {/* Condomínios */}
        {!searchTerm && (activeCategory === "todos" || activeCategory === "condominios") && (
          <section>
            <SectionHeader title="Condomínios" subtitle={`${condoProperties.length} condomínios com unidades disponíveis`} icon={Fence} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {condoProperties.map((c) => <CondoCard key={c.id} condo={c} />)}
            </div>
          </section>
        )}

        {/* Casas Bairro */}
        {!searchTerm && (activeCategory === "todos" || activeCategory === "casas") && houses.length > 0 && (
          <section>
            <SectionHeader title="Casas" subtitle={`${houses.length} casas disponíveis`} icon={Home} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {houses.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>
          </section>
        )}

        {/* Lotes Condomínio */}
        {!searchTerm && (activeCategory === "todos" || activeCategory === "lotes-cond") && condoLots.length > 0 && (
          <section>
            <SectionHeader title="Lotes em Condomínio" subtitle={`${condoLots.length} lotes em condomínios fechados`} icon={TreePine} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {condoLots.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>
          </section>
        )}

        {/* Lotes Bairro */}
        {!searchTerm && (activeCategory === "todos" || activeCategory === "lotes-bairro") && neighborhoodLots.length > 0 && (
          <section>
            <SectionHeader title="Lotes em Bairro" subtitle={`${neighborhoodLots.length} lotes em bairros abertos`} icon={MapPin} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {neighborhoodLots.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>
          </section>
        )}
        {/* Mapa Interativo */}
        {!searchTerm && (activeCategory === "todos") && (
          <section>
            <SectionHeader title="Localização dos Imóveis" subtitle="Veja todos os imóveis no mapa" icon={MapPin} />
            <SiteMap properties={available} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center">
                  <Home className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-extrabold text-white">Imob<span className="text-amber-400">CRM</span></span>
              </div>
              <p className="text-sm leading-relaxed">
                Sua imobiliária de confiança. Encontre apartamentos, casas, condomínios e lotes nas melhores localizações.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Categorias</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => setActiveCategory("apartamentos")} className="hover:text-amber-400 transition-colors">Apartamentos</button></li>
                <li><button onClick={() => setActiveCategory("casas")} className="hover:text-amber-400 transition-colors">Casas</button></li>
                <li><button onClick={() => setActiveCategory("condominios")} className="hover:text-amber-400 transition-colors">Condomínios</button></li>
                <li><button onClick={() => setActiveCategory("lotes-cond")} className="hover:text-amber-400 transition-colors">Lotes Condomínio</button></li>
                <li><button onClick={() => setActiveCategory("lotes-bairro")} className="hover:text-amber-400 transition-colors">Lotes Bairro</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Contato</h4>
              <div className="space-y-3 text-sm">
                <a href="tel:+5511999999999" className="flex items-center gap-2 hover:text-amber-400 transition-colors">
                  <Phone className="w-4 h-4" /> (11) 99999-9999
                </a>
                <a href="mailto:contato@imobcrm.com" className="flex items-center gap-2 hover:text-amber-400 transition-colors">
                  <Mail className="w-4 h-4" /> contato@imobcrm.com
                </a>
                <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors text-sm mt-2">
                  Fale pelo WhatsApp
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-xs text-gray-500">
            © 2024 ImobCRM. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* Scroll to top */}
      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-6 right-6 w-12 h-12 rounded-full bg-amber-500 text-white shadow-lg flex items-center justify-center hover:bg-amber-600 transition-all z-50",
          "opacity-100 scale-100"
        )}
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
}
