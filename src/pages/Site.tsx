import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { formatCurrency } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { PropertyDetailModal } from "@/components/PropertyDetailModal";
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
  ChevronLeft,
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
  DollarSign,
  TrendingUp,
  Trophy,
  Award,
  Medal,
  FileCheck,
  Eye,
  Heart,
  Handshake,
  Route,
  ShoppingBag,
  LogOut,
  LayoutDashboard,
  Settings,
  User,
} from "lucide-react";
import { cn, toSlug } from "@/lib/utils";
import logoImg from "@/assets/logo.png";
import { RoutePlanner } from "@/components/RoutePlanner";
import { SharkAI } from "@/components/SharkAI";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMapsLoader";

// Site property type mapped from DB
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
  image: string;
  images: string[];
  createdAt: string;
  lat: number;
  lng: number;
  decorated?: boolean;
  seaView?: boolean;
  acceptsExchange?: boolean;
  paymentConditions?: string[];
  empreendimento?: string;
  unitNumber?: string;
  boxNumber?: string;
  quadra?: string;
  lote?: string;
  exclusivityTerm?: string;
  paymentConditionsOther?: string;
  destaqueCategoria?: string;
  destaqueHome?: boolean;
  neighborhood?: string;
  vista?: string;
  caracteristicas?: string[];
}
// Broker info map
const brokerInfo: Record<string, { photo: string; whatsapp: string }> = {
  "Corretor": {
    photo: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop&crop=face",
    whatsapp: "5511999999999",
  },
};

const normalizePhone = (value?: string | null) => (value || "").replace(/\D/g, "");
const getBrokerAvatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f4c81&color=fff&size=200`;

// Will be populated from DB
let siteProperties: SiteProperty[] = [];

// These will be computed inside the component from fetched data

type Category = "todos" | "destaque" | "apartamentos" | "condominios" | "casas" | "lotes-cond" | "lotes-bairro" | "decorados" | "vista-mar";

const categories: { key: Category; label: string; icon: typeof Home }[] = [
  { key: "todos", label: "Todos", icon: Search },
  { key: "destaque", label: "Destaques", icon: Star },
  { key: "apartamentos", label: "Apartamentos", icon: Building2 },
  { key: "condominios", label: "Condomínios", icon: Fence },
  { key: "casas", label: "Casas", icon: Home },
  { key: "decorados", label: "Decorados", icon: Paintbrush },
  { key: "vista-mar", label: "Vista Mar", icon: Waves },
];

function PropertyCard({ property, onSelect, hideStamp, onViewTerm, isFavorited, onToggleFavorite, isInRoute, onToggleRoute }: { property: typeof siteProperties[0]; onSelect?: (p: typeof siteProperties[0]) => void; hideStamp?: boolean; onViewTerm?: (url: string) => void; isFavorited?: boolean; onToggleFavorite?: (id: string) => void; isInRoute?: boolean; onToggleRoute?: (id: string) => void }) {
  const [imgIndex, setImgIndex] = useState(0);
  const broker = brokerInfo[property.broker] || { photo: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop&crop=face", whatsapp: "5511999999999" };
  const whatsappMessage = encodeURIComponent(`Olá! Tenho interesse no imóvel: ${property.title} - ${formatCurrency(property.price)}`);
  const unitParts = [property.unitNumber, property.boxNumber, property.quadra, property.lote].filter(Boolean);
  const imgs = property.images && property.images.length > 0 ? property.images : [property.image];
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.address}, ${property.city}`)}`;

  return (
    <div className="group rounded-xl overflow-hidden bg-card shadow-md hover:shadow-xl transition-all duration-300 border border-border">
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
        {(property.status === "Vendido" && !hideStamp) && (
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

        {/* Exclusivity badge */}
        {property.exclusivityTerm && (
          <button
            onClick={(e) => { e.stopPropagation(); onViewTerm?.(property.exclusivityTerm!); }}
            className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-blue-500/90 text-white backdrop-blur-sm hover:bg-blue-600 transition-colors z-20 shadow-md"
          >
            <FileCheck className="w-3 h-3" /> Ex.Assinada
          </button>
        )}

        {/* Route selector */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleRoute?.(property.id); }}
          className={cn(
            "absolute z-20 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110",
            property.exclusivityTerm ? "top-12 right-3" : "top-3 right-3",
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
            "absolute z-20 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110",
            property.exclusivityTerm ? "top-[5.5rem] right-3" : "top-12 right-3",
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
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-card-foreground text-sm cursor-pointer hover:text-primary transition-colors uppercase"
            onClick={() => onSelect?.(property)}
          >{property.title}</h3>
          {(property.empreendimento || unitParts.length > 0) && (
            <div className="flex flex-wrap items-center gap-1 mt-1">
              {property.empreendimento && (
                <Link
                  to={`/empreendimento/${property.empreendimento.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`}
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
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Link to={`/corretor/${toSlug(property.broker)}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img
              src={broker.photo}
              alt={property.broker}
              className="w-7 h-7 rounded-full object-cover border-2 border-accent"
            />
            <div>
              <p className="text-[11px] font-semibold text-foreground">{property.broker}</p>
              <p className="text-[9px] text-muted-foreground">Corretor(a)</p>
            </div>
          </Link>
          <a
            href={`https://wa.me/${broker.whatsapp}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition-colors shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="w-3 h-3" /> WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
function SiteMap({ properties: mapProperties }: { properties: typeof siteProperties }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const searchMarkerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const [mapStyle, setMapStyle] = useState<"satellite" | "streets" | "dark">("satellite");
  const [mapFilterType, setMapFilterType] = useState("");
  const [mapFilterEmpreendimento, setMapFilterEmpreendimento] = useState("");
  const [mapFilterAddress, setMapFilterAddress] = useState("");
  const [debouncedAddress, setDebouncedAddress] = useState("");
  const [mapFilterPriceMax, setMapFilterPriceMax] = useState("");
  const { ready: gmapsReady } = useGoogleMapsLoader();

  const uniqueMapEmpreendimentos = [...new Set(mapProperties.map((p) => p.empreendimento).filter(Boolean))].sort();
  const uniqueMapTypes = [...new Set(mapProperties.map((p) => p.type).filter(Boolean))].sort();

  // Debounce address input for geocoding
  useEffect(() => {
    const t = setTimeout(() => setDebouncedAddress(mapFilterAddress.trim()), 500);
    return () => clearTimeout(t);
  }, [mapFilterAddress]);

  const filteredMapProperties = mapProperties.filter((p) => {
    const matchType = !mapFilterType || p.type === mapFilterType;
    const matchEmp = !mapFilterEmpreendimento || p.empreendimento === mapFilterEmpreendimento;
    const term = mapFilterAddress.toLowerCase();
    const matchAddr = !term || p.address.toLowerCase().includes(term) || p.city.toLowerCase().includes(term) || (p.neighborhood || '').toLowerCase().includes(term);
    const matchPrice = !mapFilterPriceMax || p.price <= parseInt(mapFilterPriceMax);
    return matchType && matchEmp && matchAddr && matchPrice;
  });

  const mapStyleConfig: Record<string, { mapTypeId: string; styles?: any[] }> = {
    satellite: { mapTypeId: "hybrid" },
    streets: { mapTypeId: "roadmap" },
    dark: {
      mapTypeId: "roadmap",
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
        { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#4b6878" }] },
        { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#64779e" }] },
        { featureType: "landscape.man_made", elementType: "geometry.stroke", stylers: [{ color: "#334e87" }] },
        { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#023e58" }] },
        { featureType: "poi", elementType: "geometry", stylers: [{ color: "#283d6a" }] },
        { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6f9ba5" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
        { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2c6675" }] },
        { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
        { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4e6d70" }] },
      ],
    },
  };

  // Initialize Google Map
  useEffect(() => {
    if (!gmapsReady || !mapRef.current || mapInstanceRef.current) return;
    const google = (window as any).google;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: -29.77, lng: -50.08 },
      zoom: 12,
      mapId: "SITE_HOME_MAP",
      mapTypeId: mapStyleConfig[mapStyle].mapTypeId,
      styles: mapStyleConfig[mapStyle].styles,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    mapInstanceRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();
    infoWindowRef.current = new google.maps.InfoWindow();
  }, [gmapsReady]);

  // Switch map style
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const cfg = mapStyleConfig[mapStyle];
    map.setMapTypeId(cfg.mapTypeId);
    map.setOptions({ styles: cfg.styles || null });
  }, [mapStyle]);

  // Update markers when filters change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const google = (window as any).google;
    if (!map || !google) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const colors: Record<string, string> = { Apartamento: "#2563eb", Casa: "#3b82f6", Terreno: "#22c55e", Comercial: "#8b5cf6" };
    const svgIcons: Record<string, string> = {
      Apartamento: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/></svg>`,
      Casa: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`,
      Terreno: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 20.777a6.942 6.942 0 0 1-2.5-12.026"/><path d="M14 16.95A6.942 6.942 0 0 0 18 11c0-3.866-3.582-7-8-7a8.093 8.093 0 0 0-2.2.3"/><path d="M2 21h20"/></svg>`,
      Comercial: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/></svg>`,
    };

    const shortPrice = (v: number) => {
      if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1).replace('.', ',')}M`;
      if (v >= 1_000) return `R$ ${Math.round(v / 1_000)}k`;
      return `R$ ${v}`;
    };

    filteredMapProperties.forEach((p) => {
      if (!p.lat || !p.lng) return;
      const color = colors[p.type] || "#2563eb";
      const svg = svgIcons[p.type] || svgIcons.Apartamento;
      const broker = brokerInfo[p.broker] || { photo: "", whatsapp: "5511999999999" };
      const whatsMsg = encodeURIComponent(`Olá! Tenho interesse no imóvel: ${p.title}`);

      const pinDiv = document.createElement("div");
      pinDiv.innerHTML = `
        <div style="position:relative;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;">
          <div style="background:white;color:${color};border:1.5px solid ${color};border-radius:999px;padding:2px 8px;font-size:11px;font-weight:800;font-family:system-ui,-apple-system,sans-serif;box-shadow:0 2px 6px rgba(0,0,0,0.18);white-space:nowrap;letter-spacing:-0.2px;">${shortPrice(p.price)}</div>
          <div style="position:relative;">
            <div style="width:30px;height:30px;background:${color};border:2px solid white;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">${svg}</div>
            <div style="width:8px;height:8px;background:${color};transform:rotate(45deg);margin:-5px auto 0;box-shadow:1px 1px 3px rgba(0,0,0,0.25);"></div>
          </div>
        </div>`;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: p.lat, lng: p.lng },
        map,
        content: pinDiv,
        title: p.title,
      });

      marker.addListener("click", () => {
        infoWindowRef.current.setContent(`
          <div style="font-family:system-ui,-apple-system,sans-serif;max-width:260px;">
            <img src="${p.image}" alt="${p.title}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />
            <h3 style="font-size:14px;font-weight:700;color:#1a1a1a;margin:0 0 4px;">${p.title}</h3>
            <p style="font-size:11px;color:#666;margin:0 0 6px;">📍 ${p.address}, ${p.city}</p>
            <p style="font-size:18px;font-weight:800;color:${color};margin:0 0 8px;">${formatCurrency(p.price)}</p>
            <div style="display:flex;gap:12px;font-size:11px;color:#888;margin-bottom:10px;">
              ${p.area > 0 ? `<span>📐 ${p.area}m²</span>` : ""}
              ${p.bedrooms > 0 ? `<span>🛏 ${p.bedrooms} qts</span>` : ""}
              ${p.parking > 0 ? `<span>🚗 ${p.parking} vg</span>` : ""}
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;padding-top:8px;border-top:1px solid #eee;">
              <div style="display:flex;align-items:center;gap:6px;">
                ${broker.photo ? `<img src="${broker.photo}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:2px solid #f59e0b;" />` : ""}
                <span style="font-size:11px;font-weight:600;color:#333;">${p.broker}</span>
              </div>
              <a href="https://wa.me/${broker.whatsapp}?text=${whatsMsg}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;padding:5px 10px;background:#22c55e;color:white;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none;">📱 WhatsApp</a>
            </div>
          </div>
        `);
        infoWindowRef.current.open({ map, anchor: marker });
      });

      markersRef.current.push(marker);
    });

    const validProps = filteredMapProperties.filter((p) => p.lat && p.lng);
    if (validProps.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      validProps.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
      map.fitBounds(bounds, 60);
    } else if (validProps.length === 1) {
      map.setCenter({ lat: validProps[0].lat, lng: validProps[0].lng });
      map.setZoom(15);
    }
  }, [filteredMapProperties, gmapsReady]);

  // Geocode address search and pan map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const geocoder = geocoderRef.current;
    const google = (window as any).google;
    if (!map || !geocoder || !google) return;

    if (searchMarkerRef.current) {
      searchMarkerRef.current.setMap(null);
      searchMarkerRef.current = null;
    }
    if (!debouncedAddress || debouncedAddress.length < 3) return;

    geocoder.geocode(
      { address: `${debouncedAddress}, RS, Brasil`, region: "br" },
      (results: any[], status: string) => {
        if (status === "OK" && results[0]) {
          const loc = results[0].geometry.location;
          map.panTo(loc);
          map.setZoom(15);
          const dot = document.createElement("div");
          dot.innerHTML = `<div style="width:18px;height:18px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.35);"></div>`;
          searchMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
            position: loc, map, content: dot, title: results[0].formatted_address,
          });
        }
      }
    );
  }, [debouncedAddress]);

  const mapHasFilters = mapFilterType || mapFilterEmpreendimento || mapFilterAddress || mapFilterPriceMax;

  return (
    <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 relative">
      {/* Map Style Switcher */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 p-1.5 flex gap-1">
          {([
            { key: "satellite" as const, label: "Satélite", iconSvg: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg> },
            { key: "streets" as const, label: "Ruas", iconSvg: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg> },
            { key: "dark" as const, label: "Escuro", iconSvg: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg> },
          ]).map((style) => (
            <button
              key={style.key}
              onClick={() => setMapStyle(style.key)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                mapStyle === style.key
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {style.iconSvg} {style.label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-lg border border-gray-100">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Legenda</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-700"><span className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/></svg></span> Apartamento</div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-700"><span className="w-4 h-4 rounded bg-blue-500 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></span> Casa</div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-700"><span className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10 20.777a6.942 6.942 0 0 1-2.5-12.026"/><path d="M2 21h20"/></svg></span> Terreno</div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-700"><span className="w-4 h-4 rounded bg-violet-500 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/></svg></span> Comercial</div>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000]">
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={mapFilterType}
              onChange={(e) => setMapFilterType(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Todos os tipos</option>
              {uniqueMapTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select
              value={mapFilterEmpreendimento}
              onChange={(e) => setMapFilterEmpreendimento(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Todos loteamentos</option>
              {uniqueMapEmpreendimentos.map((emp) => (
                <option key={emp} value={emp}>{emp}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="🔍 Endereço ou bairro..."
              value={mapFilterAddress}
              onChange={(e) => setMapFilterAddress(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[160px] flex-1"
            />

            <select
              value={mapFilterPriceMax}
              onChange={(e) => setMapFilterPriceMax(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Valor máximo</option>
              <option value="300000">Até R$ 300 mil</option>
              <option value="500000">Até R$ 500 mil</option>
              <option value="800000">Até R$ 800 mil</option>
              <option value="1000000">Até R$ 1 milhão</option>
              <option value="1500000">Até R$ 1,5 milhão</option>
              <option value="2000000">Até R$ 2 milhões</option>
            </select>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[11px] font-bold text-gray-500">{filteredMapProperties.filter(p => p.lat && p.lng).length} imóveis</span>
              {mapHasFilters && (
                <button
                  onClick={() => { setMapFilterType(""); setMapFilterEmpreendimento(""); setMapFilterAddress(""); setMapFilterPriceMax(""); }}
                  className="px-2 py-1 rounded-lg bg-gray-100 text-gray-500 text-[11px] font-medium hover:bg-gray-200 transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div ref={mapRef} style={{ height: "500px", width: "100%" }} />
    </div>
  );
}

function SectionHeader({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: typeof Home }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center shadow-md">
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
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [imoveisMenuOpen, setImoveisMenuOpen] = useState(false);
  const [empreendMenuOpen, setEmpreendMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const imoveisMenuRef = useRef<HTMLDivElement>(null);
  const empreendMenuRef = useRef<HTMLDivElement>(null);
  const searchParams = new URLSearchParams(window.location.search);
  const initialTipo = searchParams.get("tipo") || "";
  const initialCidade = searchParams.get("cidade") || "";

  const [siteProperties, setSiteProperties] = useState<SiteProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCity, setFilterCity] = useState(initialCidade);
  const [filterBedrooms, setFilterBedrooms] = useState("");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [filterType, setFilterType] = useState(initialTipo);
  const [filterCondition, setFilterCondition] = useState("");
  const [filterEmpreendimento, setFilterEmpreendimento] = useState("");
  const [filterParking, setFilterParking] = useState("");
  const [filterVista, setFilterVista] = useState("");
  const [filterNeighborhood, setFilterNeighborhood] = useState("");
  const [filterCaracteristica, setFilterCaracteristica] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<SiteProperty | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [priceSort, setPriceSort] = useState<"" | "asc" | "desc">("");
  const [showFullRanking, setShowFullRanking] = useState(false);
  const [viewingTerm, setViewingTerm] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("mv-favorites") || "[]");
    } catch { return []; }
  });

  // Close user/imoveis menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (imoveisMenuRef.current && !imoveisMenuRef.current.contains(e.target as Node)) {
        setImoveisMenuOpen(false);
      }
      if (empreendMenuRef.current && !empreendMenuRef.current.contains(e.target as Node)) {
        setEmpreendMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("mv-favorites", JSON.stringify(next));
      return next;
    });
  };

  const [routeIds, setRouteIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("mv-route-ids") || "[]"); } catch { return []; }
  });
  const toggleRoute = (id: string) => {
    setRouteIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("mv-route-ids", JSON.stringify(next));
      return next;
    });
  };

  // Fetch properties from DB
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      const [{ data, error }, { data: brokersData }] = await Promise.all([
        supabase.from("imoveis").select("*, edificios(nome), condominios(nome), empreendimentos(nome)").eq("ativo_site", true),
        supabase.from("subscriber_brokers").select("name, phone").eq("status", "active"),
      ]);

      (brokersData || []).forEach((broker: any) => {
        if (!broker?.name) return;
        brokerInfo[broker.name] = {
          photo: brokerInfo[broker.name]?.photo || getBrokerAvatar(broker.name),
          whatsapp: normalizePhone(broker.phone) || brokerInfo[broker.name]?.whatsapp || "5511999999999",
        };
      });

      if (!error && data) {
        const mapped: SiteProperty[] = data.map((row) => {
          const brokerName = row.corretor_nome?.trim() || "Corretor";

          if (!brokerInfo[brokerName]) {
            brokerInfo[brokerName] = {
              photo: getBrokerAvatar(brokerName),
              whatsapp: "5511999999999",
            };
          }

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
            image: row.imagens?.[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop",
            images: row.imagens || [],
            createdAt: row.created_at,
            lat: Number((row as any).latitude) || 0,
            lng: Number((row as any).longitude) || 0,
            decorated: row.decorado,
            seaView: row.vista_mar,
            acceptsExchange: row.aceita_permuta,
            paymentConditions: row.condicoes_pagamento || [],
            empreendimento: row.empreendimento || (row as any).edificios?.nome || (row as any).condominios?.nome || (row as any).empreendimentos?.nome || "",
            unitNumber: row.unidade || "",
            boxNumber: row.box || "",
            quadra: row.quadra || "",
            lote: row.lote || "",
            exclusivityTerm: row.termo_exclusividade || "",
            destaqueCategoria: (row as any).destaque_categoria || "",
            destaqueHome: row.destaque_home,
            neighborhood: row.bairro || "",
            vista: row.vista || "",
            caracteristicas: row.outras_caracteristicas || [],
          };
        });
        setSiteProperties(mapped);
      }
      setLoading(false);
    };
    fetchProperties();
  }, []);

  const favoritedProperties = siteProperties.filter((p) => favoriteIds.includes(p.id));
  const routeProperties = siteProperties.filter((p) => routeIds.includes(p.id));

  // Computed arrays - homepage only shows destaque_home properties in category sections
  const available = siteProperties.filter((p) => p.status === "Disponível");
  const destaqueAvailable = available.filter((p) => p.destaqueHome);
  const soldProperties = siteProperties.filter((p) => p.status === "Vendido" || p.status === "Reservado");
  const soldValue = soldProperties.reduce((sum, p) => sum + p.price, 0);
  const totalVGV = available.reduce((sum, p) => sum + p.price, 0);
  const featured = destaqueAvailable.filter((p) => p.destaqueCategoria).slice(0, 4);
  const apartments = destaqueAvailable.filter((p) => p.destaqueCategoria === "apartamentos" || p.destaqueCategoria === "Apartamentos" || (!p.destaqueCategoria && p.type === "Apartamento"));
  const houses = destaqueAvailable.filter((p) => p.destaqueCategoria === "casas" || p.destaqueCategoria === "Casas" || (!p.destaqueCategoria && p.type === "Casa"));
  const lots = destaqueAvailable.filter((p) => p.destaqueCategoria === "lotes-cond" || p.destaqueCategoria === "lotes-bairro" || p.destaqueCategoria === "Lotes" || (!p.destaqueCategoria && p.type === "Terreno"));
  const decorated = destaqueAvailable.filter((p) => p.destaqueCategoria === "decorados" || p.destaqueCategoria === "Decorados" || (!p.destaqueCategoria && p.decorated));
  const seaViewProperties = destaqueAvailable.filter((p) => p.destaqueCategoria === "vista-mar" || p.destaqueCategoria === "Vista Mar" || (!p.destaqueCategoria && p.seaView));
  const condoHouses = destaqueAvailable.filter((p) => p.destaqueCategoria === "condominios" || p.destaqueCategoria === "Condomínios" || (!p.destaqueCategoria && (p.type === "Casa" || p.type === "Condomínio") && p.empreendimento && p.empreendimento.toLowerCase().includes("cond")));
  const condoLots = lots.filter((l) => l.destaqueCategoria === "lotes-cond" || l.title.toLowerCase().includes("condomínio") || l.title.toLowerCase().includes("reserva"));
  const neighborhoodLots = lots.filter((l) => l.destaqueCategoria === "lotes-bairro" || (!l.destaqueCategoria && !l.title.toLowerCase().includes("condomínio") && !l.title.toLowerCase().includes("reserva")));

  // Continuous scroll uses CSS animation, no JS timer needed
  const maxIndex = Math.max(0, soldProperties.length - 4);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setShowScrollTop(e.currentTarget.scrollTop > 400);
  };

  const scrollToTop = () => {
    document.getElementById("site-top")?.scrollIntoView({ behavior: "smooth" });
  };

  const clearFilters = () => {
    setFilterCity("");
    setFilterBedrooms("");
    setFilterPriceMin("");
    setFilterPriceMax("");
    setFilterType("");
    setFilterCondition("");
    setFilterEmpreendimento("");
    setFilterParking("");
    setFilterVista("");
    setFilterNeighborhood("");
    setFilterCaracteristica("");
    setSearchTerm("");
  };

  const hasActiveFilters = filterCity || filterBedrooms || filterPriceMin || filterPriceMax || filterType || filterCondition || filterEmpreendimento || filterParking || filterVista || filterNeighborhood || filterCaracteristica;

  const uniqueEmpreendimentos = [...new Set(available.map((p) => p.empreendimento).filter(Boolean))].sort();
  const uniqueNeighborhoods = [...new Set(available.map((p) => p.neighborhood).filter(Boolean))].sort();
  const uniqueVistas = [...new Set(available.map((p) => p.vista).filter(Boolean))].sort();
  const uniqueCaracteristicas = [...new Set(available.flatMap((p) => p.caracteristicas || []).filter(Boolean))].sort();

  const filteredAll = available.filter((p) => {
    const matchSearch = !searchTerm ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.neighborhood || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCity = !filterCity || p.city === filterCity;
    const matchBedrooms = !filterBedrooms || p.bedrooms >= parseInt(filterBedrooms);
    const matchPriceMin = !filterPriceMin || p.price >= parseInt(filterPriceMin);
    const matchPriceMax = !filterPriceMax || p.price <= parseInt(filterPriceMax);
    const matchType = !filterType || p.type === filterType;
    const matchCondition = !filterCondition || (
      Array.isArray(p.paymentConditions) && p.paymentConditions.some(c => c.toLowerCase().includes(filterCondition.toLowerCase()))
    );
    const matchEmpreendimento = !filterEmpreendimento || p.empreendimento === filterEmpreendimento;
    const matchParking = !filterParking || p.parking >= parseInt(filterParking);
    const matchVista = !filterVista || p.vista === filterVista;
    const matchNeighborhood = !filterNeighborhood || p.neighborhood === filterNeighborhood;
    const matchCaracteristica = !filterCaracteristica || (p.caracteristicas || []).includes(filterCaracteristica);
    return matchSearch && matchCity && matchBedrooms && matchPriceMin && matchPriceMax && matchType && matchCondition && matchEmpreendimento && matchParking && matchVista && matchNeighborhood && matchCaracteristica;
  });

  const sortByPrice = <T extends { price: number }>(arr: T[]): T[] => {
    if (!priceSort) return arr;
    return [...arr].sort((a, b) => priceSort === "asc" ? a.price - b.price : b.price - a.price);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans" onScroll={handleScroll}>
      <div id="site-top" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="MV BROKER CONNECT" className="h-8 object-contain" />
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-gray-600">
            <button onClick={() => { setActiveCategory("todos"); document.getElementById("site-top")?.scrollIntoView({ behavior: "smooth" }); }} className="hover:text-primary transition-colors">
              Início
            </button>

            {/* Imóveis dropdown */}
            <div className="relative" ref={imoveisMenuRef}>
              <button
                onClick={() => setImoveisMenuOpen(!imoveisMenuOpen)}
                className={cn("flex items-center gap-1 hover:text-primary transition-colors", imoveisMenuOpen && "text-primary")}
              >
                Imóveis <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {imoveisMenuOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {categories.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => { setActiveCategory(cat.key); setImoveisMenuOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors",
                        activeCategory === cat.key && "text-primary font-semibold bg-gray-50"
                      )}
                    >
                      <cat.icon className="w-4 h-4" /> {cat.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Empreendimentos dropdown */}
            <div className="relative" ref={empreendMenuRef}>
              <button
                onClick={() => setEmpreendMenuOpen(!empreendMenuOpen)}
                className={cn("flex items-center gap-1 hover:text-primary transition-colors", empreendMenuOpen && "text-primary")}
              >
                Empreendimentos <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {empreendMenuOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link to="/condominios" onClick={() => setEmpreendMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Fence className="w-4 h-4" /> Condomínios
                  </Link>
                  <Link to="/edificios" onClick={() => setEmpreendMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Building2 className="w-4 h-4" /> Edifícios
                  </Link>
                  <Link to="/empreendimentos" onClick={() => setEmpreendMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <TreePine className="w-4 h-4" /> Loteamentos
                  </Link>
                </div>
              )}
            </div>

            <Link to="/mapas-condominio" className="hover:text-primary transition-colors">Mapa Condomínio</Link>
            <Link to="/galeria-cidade" className="hover:text-primary transition-colors">Fotos da Cidade</Link>
            <Link to="/planos" className="hover:text-primary transition-colors">Planos</Link>
            <a href="#contato" className="hover:text-primary transition-colors">Contato</a>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFavorites(true)}
              className="relative p-2 text-gray-600 hover:text-red-500 transition-colors"
              title="Favoritos"
            >
              <Heart className={cn("w-5 h-5", favoriteIds.length > 0 && "fill-red-500 text-red-500")} />
              {favoriteIds.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {favoriteIds.length}
                </span>
              )}
            </button>

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-semibold text-gray-700"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline max-w-[100px] truncate">{profile?.full_name || "Conta"}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button onClick={() => { navigate("/dashboard"); setUserMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </button>
                    <button onClick={() => { navigate("/configuracoes"); setUserMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <Settings className="w-4 h-4" /> Configurações
                    </button>
                    <button onClick={() => { navigate("/painel/assinatura"); setUserMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <CreditCard className="w-4 h-4" /> Planos
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button onClick={() => { signOut(); setUserMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut className="w-4 h-4" /> Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
              >
                Login
              </Link>
            )}
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
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="space-y-8">
            {/* Title */}
            <div className="max-w-2xl space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
                MV <span className="text-blue-400">CONNECT</span>
              </h1>
              <p className="text-lg text-gray-300 leading-relaxed">
                Conectando corretores a corretores e imóveis a clientes.
              </p>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <button
                onClick={() => setActiveCategory("todos")}
                className="group bg-white/10 hover:bg-blue-500/90 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:border-blue-400 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-400/20 group-hover:bg-white/20 flex items-center justify-center mb-3 transition-colors">
                  <Star className="w-5 h-5 text-blue-400 group-hover:text-white transition-colors" />
                </div>
                <p className="text-2xl font-black text-white">{available.length}</p>
                <p className="text-[11px] font-semibold text-gray-300 group-hover:text-blue-100 uppercase tracking-wider">Total Imóveis</p>
              </button>

              <button
                onClick={() => setActiveCategory("apartamentos")}
                className="group bg-white/10 hover:bg-blue-500/90 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:border-blue-400 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-400/20 group-hover:bg-white/20 flex items-center justify-center mb-3 transition-colors">
                  <Building2 className="w-5 h-5 text-blue-400 group-hover:text-white transition-colors" />
                </div>
                <p className="text-2xl font-black text-white">{apartments.length}</p>
                <p className="text-[11px] font-semibold text-gray-300 group-hover:text-blue-100 uppercase tracking-wider">Apartamentos</p>
              </button>

              <button
                onClick={() => setActiveCategory("condominios")}
                className="group bg-white/10 hover:bg-emerald-500/90 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:border-emerald-400 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/20 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-400/20 group-hover:bg-white/20 flex items-center justify-center mb-3 transition-colors">
                  <Fence className="w-5 h-5 text-emerald-400 group-hover:text-white transition-colors" />
                </div>
                <p className="text-2xl font-black text-white">{condoHouses.length}</p>
                <p className="text-[11px] font-semibold text-gray-300 group-hover:text-emerald-100 uppercase tracking-wider">Condomínios</p>
              </button>

              <button
                onClick={() => { setFilterCity("Capão da Canoa"); setActiveCategory("todos"); }}
                className="group bg-white/10 hover:bg-cyan-500/90 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:border-cyan-400 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-400/20 group-hover:bg-white/20 flex items-center justify-center mb-3 transition-colors">
                  <MapPin className="w-5 h-5 text-cyan-400 group-hover:text-white transition-colors" />
                </div>
                <p className="text-2xl font-black text-white">{available.filter((p) => p.city.toLowerCase().includes("capão")).length}</p>
                <p className="text-[11px] font-semibold text-gray-300 group-hover:text-cyan-100 uppercase tracking-wider">Capão da Canoa</p>
              </button>

              <button
                onClick={() => { setFilterCity("Xangri-lá"); setActiveCategory("todos"); }}
                className="group bg-white/10 hover:bg-violet-500/90 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:border-violet-400 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-violet-500/20 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-400/20 group-hover:bg-white/20 flex items-center justify-center mb-3 transition-colors">
                  <MapPin className="w-5 h-5 text-violet-400 group-hover:text-white transition-colors" />
                </div>
                <p className="text-2xl font-black text-white">{available.filter((p) => p.city.toLowerCase().includes("xangri")).length}</p>
                <p className="text-[11px] font-semibold text-gray-300 group-hover:text-violet-100 uppercase tracking-wider">Xangri-lá</p>
              </button>

              <div className="bg-gradient-to-br from-blue-500/30 to-blue-600/30 backdrop-blur-md rounded-2xl p-4 border border-blue-400/40">
                <div className="w-10 h-10 rounded-xl bg-blue-400/30 flex items-center justify-center mb-3">
                  <DollarSign className="w-5 h-5 text-blue-300" />
                </div>
                <p className="text-lg font-black text-blue-300 leading-tight">{formatCurrency(totalVGV)}</p>
                <p className="text-[11px] font-semibold text-blue-200/80 uppercase tracking-wider">VGV Cadastrado</p>
              </div>
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-2xl">
              <div className="flex items-center bg-white rounded-2xl p-2 shadow-xl flex-1">
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
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold transition-all backdrop-blur-sm border border-white/30 hover:scale-105"
              >
                <SlidersHorizontal className="w-4 h-4" /> Filtros
                <ChevronDown className={cn("w-4 h-4 transition-transform", showFilters && "rotate-180")} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Cidade</label>
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Todas</option>
                  <option value="Capão da Canoa">Capão da Canoa</option>
                  <option value="Xangri-lá">Xangri-lá</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Tipo</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Todos</option>
                  <option value="Apartamento">Apartamento</option>
                  <option value="Casa">Casa</option>
                  <option value="Terreno">Terreno</option>
                  <option value="Comercial">Comercial</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Quartos (mín.)</label>
                <select
                  value={filterBedrooms}
                  onChange={(e) => setFilterBedrooms(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Empreendimento</label>
                <select
                  value={filterEmpreendimento}
                  onChange={(e) => setFilterEmpreendimento(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Todos</option>
                  {uniqueEmpreendimentos.map((emp) => (
                    <option key={emp} value={emp}>{emp}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={() => { setActiveCategory("todos"); setShowFilters(false); }}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-colors"
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
                  ? "bg-blue-500 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <cat.icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">




        {/* Search / Filter results */}
        {(searchTerm || hasActiveFilters) && (
          <section>
            <SectionHeader
              title={searchTerm ? `Resultados para "${searchTerm}"` : "Resultados dos Filtros"}
              subtitle={`${filteredAll.length} imóveis encontrados`}
              icon={Search}
            />
            {filteredAll.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredAll.map((p) => <PropertyCard key={p.id} property={p} onSelect={setSelectedProperty} onViewTerm={setViewingTerm} isFavorited={favoriteIds.includes(p.id)} onToggleFavorite={toggleFavorite} isInRoute={routeIds.includes(p.id)} onToggleRoute={toggleRoute} />)}
              </div>
            ) : (
              <p className="text-center py-12 text-gray-400">Nenhum imóvel encontrado com os filtros selecionados.</p>
            )}
          </section>
        )}

        {/* Últimas Vendas - Carrossel */}
        {!searchTerm && !hasActiveFilters && activeCategory === "todos" && soldProperties.length > 0 && (
          <section>
            <SectionHeader
              title={`Últimas Vendas — VGV ${formatCurrency(soldValue)}`}
              subtitle={`${soldProperties.length} imóveis vendidos`}
              icon={TrendingUp}
            />
            <div className="relative overflow-hidden">
              <div
                className="flex gap-6 animate-scroll"
                style={{
                  animationDuration: `${soldProperties.length * 5}s`,
                }}
              >
                {[...soldProperties, ...soldProperties].map((p, idx) => (
                  <div key={`${p.id}-${idx}`} className="w-[calc(25%-18px)] flex-shrink-0">
                    <PropertyCard property={{ ...p, status: "Vendido" as const }} onSelect={setSelectedProperty} onViewTerm={setViewingTerm} hideStamp isFavorited={favoriteIds.includes(p.id)} onToggleFavorite={toggleFavorite} isInRoute={routeIds.includes(p.id)} onToggleRoute={toggleRoute} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Ranking de Corretores */}
        {!searchTerm && !hasActiveFilters && activeCategory === "todos" && soldProperties.length > 0 && (() => {
          const brokerSales: Record<string, { count: number; value: number }> = {};
          soldProperties.forEach((p) => {
            if (!brokerSales[p.broker]) brokerSales[p.broker] = { count: 0, value: 0 };
            brokerSales[p.broker].count++;
            brokerSales[p.broker].value += p.price;
          });
          const ranking = Object.entries(brokerSales)
            .map(([name, data]) => ({ name, ...data, photo: brokerInfo[name]?.photo || "" }))
            .sort((a, b) => b.value - a.value);
          const displayRanking = showFullRanking ? ranking : ranking.slice(0, 3);
          const medalColors = ["from-blue-400 to-yellow-500", "from-gray-300 to-gray-400", "from-blue-400 to-blue-500"];
          const medalIcons = [Trophy, Award, Medal];

          return (
            <section>
              <SectionHeader title="Ranking de Corretores" subtitle="Os corretores que mais venderam" icon={Trophy} />
              <div className="space-y-3">
                {displayRanking.map((broker, i) => {
                  const MedalIcon = medalIcons[i] || Star;
                  const slug = toSlug(broker.name);
                  return (
                    <Link
                      key={broker.name}
                      to={`/corretor/${slug}`}
                      className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all group"
                    >
                      {/* Position */}
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shadow-md flex-shrink-0",
                        i < 3 ? `bg-gradient-to-br ${medalColors[i]} text-white` : "bg-gray-100 text-gray-500"
                      )}>
                        {i < 3 ? (
                          <MedalIcon className="w-6 h-6" />
                        ) : (
                          <span className="text-lg font-extrabold">{i + 1}º</span>
                        )}
                      </div>

                      {/* Photo */}
                      <img
                        src={broker.photo}
                        alt={broker.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 group-hover:border-blue-400 transition-colors flex-shrink-0"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{broker.name}</p>
                        <p className="text-xs text-gray-500">{broker.count} {broker.count === 1 ? "venda" : "vendas"}</p>
                      </div>

                      {/* Value */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-extrabold text-emerald-600">{formatCurrency(broker.value)}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">VGV vendido</p>
                      </div>

                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
              <div className="flex justify-center mt-4">
                <Link
                  to="/ranking"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg"
                >
                  <Trophy className="w-4 h-4 text-blue-400" />
                  Ver Ranking Completo
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </section>
          );
        })()}

        {/* Parceiros MV BROKER CONNECT */}
        {!searchTerm && !hasActiveFilters && activeCategory === "todos" && (
          <section>
            <SectionHeader title="Parceiros MV BROKER CONNECT" subtitle="Empresas que confiam na nossa rede" icon={Handshake} />
            <div className="relative overflow-hidden">
              <div className="flex animate-scroll gap-8 items-center">
                {[
                  { name: "Construtora Litoral", logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=100&fit=crop" },
                  { name: "Incorporadora Sul", logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=100&fit=crop" },
                  { name: "Imobiliária Central", logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&h=100&fit=crop" },
                  { name: "Porto Seguro Imóveis", logo: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=100&fit=crop" },
                  { name: "Engenharia & Projetos", logo: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&h=100&fit=crop" },
                  { name: "Financeira Prime", logo: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&h=100&fit=crop" },
                  { name: "Seguradora Atlas", logo: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=200&h=100&fit=crop" },
                  { name: "Arquitetura Moderna", logo: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=200&h=100&fit=crop" },
                  { name: "Design & Interiores", logo: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=200&h=100&fit=crop" },
                  { name: "Solar Energia", logo: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=200&h=100&fit=crop" },
                ].concat([
                  { name: "Construtora Litoral", logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=100&fit=crop" },
                  { name: "Incorporadora Sul", logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=100&fit=crop" },
                  { name: "Imobiliária Central", logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&h=100&fit=crop" },
                  { name: "Porto Seguro Imóveis", logo: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=100&fit=crop" },
                  { name: "Engenharia & Projetos", logo: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&h=100&fit=crop" },
                  { name: "Financeira Prime", logo: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&h=100&fit=crop" },
                  { name: "Seguradora Atlas", logo: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=200&h=100&fit=crop" },
                  { name: "Arquitetura Moderna", logo: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=200&h=100&fit=crop" },
                  { name: "Design & Interiores", logo: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=200&h=100&fit=crop" },
                  { name: "Solar Energia", logo: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=200&h=100&fit=crop" },
                ]).map((partner, i) => (
                  <Link
                    key={`${partner.name}-${i}`}
                    to={`/parceiro/${partner.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`}
                    className="flex-shrink-0 w-40 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden hover:border-blue-300"
                  >
                    <div className="h-20 overflow-hidden">
                      <img src={partner.logo} alt={partner.name} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-[11px] font-bold text-gray-700 text-center py-2 px-1 truncate">{partner.name}</p>
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex justify-center mt-4">
              <Link
                to="/parceiros"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
              >
                <Handshake className="w-4 h-4 text-info" />
                Ver Todos os Parceiros
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        )}

        {!searchTerm && !hasActiveFilters && (activeCategory === "todos" || activeCategory === "destaque") && (
          <div className="flex items-center justify-center gap-3 mb-2">
            <Star className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Imóveis em Destaque</h2>
          </div>
        )}

        {/* Apartamentos */}
        {!searchTerm && !hasActiveFilters && (activeCategory === "todos" || activeCategory === "apartamentos") && apartments.length > 0 && (
          <section>
            <SectionHeader title="Apartamentos" subtitle={`${apartments.length} apartamentos disponíveis`} icon={Building2} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sortByPrice(apartments).slice(0, 4).map((p) => <PropertyCard key={p.id} property={p} onSelect={setSelectedProperty} onViewTerm={setViewingTerm} isFavorited={favoriteIds.includes(p.id)} onToggleFavorite={toggleFavorite} isInRoute={routeIds.includes(p.id)} onToggleRoute={toggleRoute} />)}
            </div>
          </section>
        )}

        {/* Condomínios */}
        {!searchTerm && !hasActiveFilters && (activeCategory === "todos" || activeCategory === "condominios") && condoHouses.length > 0 && (
          <section>
            <SectionHeader title="Condomínios" subtitle={`${condoHouses.length} imóveis em condomínios`} icon={Fence} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sortByPrice(condoHouses).slice(0, 4).map((p) => <PropertyCard key={p.id} property={p} onSelect={setSelectedProperty} onViewTerm={setViewingTerm} isFavorited={favoriteIds.includes(p.id)} onToggleFavorite={toggleFavorite} isInRoute={routeIds.includes(p.id)} onToggleRoute={toggleRoute} />)}
            </div>
          </section>
        )}

        {/* Casas */}
        {!searchTerm && !hasActiveFilters && (activeCategory === "todos" || activeCategory === "casas") && houses.length > 0 && (
          <section>
            <SectionHeader title="Casas" subtitle={`${houses.length} casas disponíveis`} icon={Home} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sortByPrice(houses).slice(0, 4).map((p) => <PropertyCard key={p.id} property={p} onSelect={setSelectedProperty} onViewTerm={setViewingTerm} isFavorited={favoriteIds.includes(p.id)} onToggleFavorite={toggleFavorite} isInRoute={routeIds.includes(p.id)} onToggleRoute={toggleRoute} />)}
            </div>
          </section>
        )}

        {/* Decorados */}
        {!searchTerm && !hasActiveFilters && (activeCategory === "todos" || activeCategory === "decorados") && decorated.length > 0 && (
          <section>
            <SectionHeader title="Decorados" subtitle={`${decorated.length} imóveis com decoração inclusa`} icon={Paintbrush} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sortByPrice(decorated).slice(0, 4).map((p) => <PropertyCard key={p.id} property={p} onSelect={setSelectedProperty} onViewTerm={setViewingTerm} isFavorited={favoriteIds.includes(p.id)} onToggleFavorite={toggleFavorite} isInRoute={routeIds.includes(p.id)} onToggleRoute={toggleRoute} />)}
            </div>
          </section>
        )}

        {/* Vista para o Mar */}
        {!searchTerm && !hasActiveFilters && (activeCategory === "todos" || activeCategory === "vista-mar") && seaViewProperties.length > 0 && (
          <section>
            <SectionHeader title="Vista para o Mar" subtitle={`${seaViewProperties.length} imóveis com vista mar`} icon={Waves} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sortByPrice(seaViewProperties).slice(0, 4).map((p) => <PropertyCard key={p.id} property={p} onSelect={setSelectedProperty} onViewTerm={setViewingTerm} isFavorited={favoriteIds.includes(p.id)} onToggleFavorite={toggleFavorite} isInRoute={routeIds.includes(p.id)} onToggleRoute={toggleRoute} />)}
            </div>
          </section>
        )}


        {/* Lotes Condomínio */}
        {!searchTerm && !hasActiveFilters && (activeCategory === "todos" || activeCategory === "lotes-cond") && condoLots.length > 0 && (
          <section>
            <SectionHeader title="Lotes em Condomínio" subtitle={`${condoLots.length} lotes em condomínios fechados`} icon={TreePine} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sortByPrice(condoLots).slice(0, 4).map((p) => <PropertyCard key={p.id} property={p} onSelect={setSelectedProperty} onViewTerm={setViewingTerm} isFavorited={favoriteIds.includes(p.id)} onToggleFavorite={toggleFavorite} isInRoute={routeIds.includes(p.id)} onToggleRoute={toggleRoute} />)}
            </div>
          </section>
        )}

        {/* Lotes Bairro */}
        {!searchTerm && !hasActiveFilters && (activeCategory === "todos" || activeCategory === "lotes-bairro") && neighborhoodLots.length > 0 && (
          <section>
            <SectionHeader title="Lotes em Bairro" subtitle={`${neighborhoodLots.length} lotes em bairros abertos`} icon={MapPin} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sortByPrice(neighborhoodLots).slice(0, 4).map((p) => <PropertyCard key={p.id} property={p} onSelect={setSelectedProperty} onViewTerm={setViewingTerm} isFavorited={favoriteIds.includes(p.id)} onToggleFavorite={toggleFavorite} isInRoute={routeIds.includes(p.id)} onToggleRoute={toggleRoute} />)}
            </div>
          </section>
        )}

        {/* Ver Todos os Imóveis */}
        {!searchTerm && !hasActiveFilters && activeCategory === "todos" && (
          <div className="flex justify-center">
            <Link
              to="/todos-imoveis"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-400 text-white text-base font-extrabold hover:from-blue-600 hover:to-blue-500 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Search className="w-5 h-5" /> Ver Todos os Imóveis ({available.length})
            </Link>
          </div>
        )}
        {/* Mapa Interativo */}
        {!searchTerm && !hasActiveFilters && (activeCategory === "todos") && (
          <section>
            <SectionHeader title="Localização dos Imóveis" subtitle="Veja todos os imóveis no mapa" icon={MapPin} />
            <SiteMap properties={siteProperties} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
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
              <h4 className="font-bold text-white mb-4">Categorias</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => setActiveCategory("apartamentos")} className="hover:text-blue-400 transition-colors">Apartamentos</button></li>
                <li><button onClick={() => setActiveCategory("casas")} className="hover:text-blue-400 transition-colors">Casas</button></li>
                <li><button onClick={() => setActiveCategory("condominios")} className="hover:text-blue-400 transition-colors">Condomínios</button></li>
                <li><button onClick={() => setActiveCategory("lotes-cond")} className="hover:text-blue-400 transition-colors">Lotes Condomínio</button></li>
                <li><button onClick={() => setActiveCategory("lotes-bairro")} className="hover:text-blue-400 transition-colors">Lotes Bairro</button></li>
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

      {/* Scroll to top */}
      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-6 right-6 w-12 h-12 rounded-full bg-blue-500 text-white shadow-lg flex items-center justify-center hover:bg-blue-600 transition-all z-50",
          "opacity-100 scale-100"
        )}
      >
        <ArrowUp className="w-5 h-5" />
      </button>
      <RoutePlanner properties={routeProperties as any} />
      <SharkAI properties={siteProperties as any} onSelectProperty={setSelectedProperty as any} />
      <PropertyDetailModal
        property={selectedProperty as any}
        onClose={() => setSelectedProperty(null)}
        allProperties={siteProperties as any}
        brokerInfo={brokerInfo}
        onSelectSimilar={(p: any) => setSelectedProperty(p)}
      />

      {/* Term Viewer Modal */}
      {viewingTerm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingTerm(null)}>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-500" />
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

      {/* Favorites Page Overlay */}
      {showFavorites && (
        <FavoritesPage
          allProperties={siteProperties}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
          onSelectProperty={setSelectedProperty}
          onClose={() => setShowFavorites(false)}
          routeIds={routeIds}
          onToggleRoute={toggleRoute}
          onViewTerm={setViewingTerm}
        />
      )}
    </div>
  );
}

/* =================== FAVORITES PAGE =================== */
function FavoritesPage({
  allProperties,
  favoriteIds,
  onToggleFavorite,
  onSelectProperty,
  onClose,
  routeIds,
  onToggleRoute,
  onViewTerm,
}: {
  allProperties: SiteProperty[];
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  onSelectProperty: (p: SiteProperty) => void;
  onClose: () => void;
  routeIds: string[];
  onToggleRoute: (id: string) => void;
  onViewTerm: (url: string) => void;
}) {
  const [sortBy, setSortBy] = useState<"recent" | "price-asc" | "price-desc" | "area-desc">("recent");
  const [filterType, setFilterType] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterBedrooms, setFilterBedrooms] = useState("");

  const favorites = allProperties.filter((p) => favoriteIds.includes(p.id));

  const uniqueTypes = [...new Set(favorites.map((p) => p.type))].sort();
  const uniqueCities = [...new Set(favorites.map((p) => p.city))].sort();

  let filtered = [...favorites];
  if (filterType) filtered = filtered.filter((p) => p.type === filterType);
  if (filterCity) filtered = filtered.filter((p) => p.city === filterCity);
  if (filterBedrooms) filtered = filtered.filter((p) => p.bedrooms >= parseInt(filterBedrooms));

  switch (sortBy) {
    case "price-asc": filtered.sort((a, b) => a.price - b.price); break;
    case "price-desc": filtered.sort((a, b) => b.price - a.price); break;
    case "area-desc": filtered.sort((a, b) => b.area - a.area); break;
    default: break;
  }

  const clearFilters = () => { setFilterType(""); setFilterCity(""); setFilterBedrooms(""); };
  const hasFilters = filterType || filterCity || filterBedrooms;

  return (
    <div className="fixed inset-0 z-[60] bg-gray-50 overflow-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            <h1 className="text-lg font-bold text-gray-900">Meus Favoritos</h1>
            <span className="text-sm text-gray-500">({favorites.length} imóveis)</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {favorites.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <Heart className="w-16 h-16 text-gray-300 mx-auto" />
            <h2 className="text-xl font-bold text-gray-700">Nenhum favorito ainda</h2>
            <p className="text-gray-500">Clique no coração dos imóveis para adicioná-los aqui.</p>
            <button onClick={onClose} className="mt-4 px-6 py-2.5 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors">
              Voltar ao site
            </button>
          </div>
        ) : (
          <>
            {/* Filters & Sort Bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <SlidersHorizontal className="w-4 h-4" /> Filtros:
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              >
                <option value="">Todos os tipos</option>
                {uniqueTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              >
                <option value="">Todas as cidades</option>
                {uniqueCities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={filterBedrooms}
                onChange={(e) => setFilterBedrooms(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              >
                <option value="">Quartos</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
              {hasFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                  <X className="w-3.5 h-3.5" /> Limpar
                </button>
              )}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-gray-500">Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                >
                  <option value="recent">Mais recentes</option>
                  <option value="price-asc">Menor preço</option>
                  <option value="price-desc">Maior preço</option>
                  <option value="area-desc">Maior área</option>
                </select>
              </div>
            </div>

            {/* Results */}
            <p className="text-sm text-gray-500 mb-4">{filtered.length} imóvel(is) encontrado(s)</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onSelect={() => { onSelectProperty(property); onClose(); }}
                  isFavorited={true}
                  onToggleFavorite={onToggleFavorite}
                  isInRoute={routeIds.includes(property.id)}
                  onToggleRoute={onToggleRoute}
                  onViewTerm={onViewTerm}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
