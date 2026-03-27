import { useParams, Link } from "react-router-dom";
import { properties, formatCurrency, type Property } from "@/data/mockData";
import {
  Building2,
  MapPin,
  BedDouble,
  Bath,
  Car,
  Ruler,
  Phone,
  ArrowLeft,
  Camera,
  Home,
  Waves,
  Paintbrush,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useState } from "react";

// Extended properties (same as Site.tsx) - in production this would come from a shared data source
const allProperties: Property[] = [
  ...properties,
  {
    id: "site-1",
    title: "Apartamento Beira Mar Navegantes",
    address: "Av. Beira Mar, 1800",
    city: "Capão da Canoa",
    type: "Apartamento",
    status: "Disponível",
    price: 780000,
    area: 95,
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    broker: "Ana Rodrigues",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop",
    images: [],
    createdAt: "2024-03-20",
    lat: -29.743,
    lng: -50.098,
    decorated: false,
    seaView: true,
    acceptsExchange: true,
    paymentConditions: ["48x", "Permuta"],
    empreendimento: "Ed. Navegantes",
    unitNumber: "Ap 501",
    boxNumber: "Box 15",
  },
  {
    id: "site-6",
    title: "Apartamento Alto Padrão Atlântida",
    address: "Av. Atlântida, 600",
    city: "Xangri-lá",
    type: "Apartamento",
    status: "Disponível",
    price: 1100000,
    area: 150,
    bedrooms: 3,
    bathrooms: 3,
    parking: 2,
    broker: "Marcos Oliveira",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop",
    images: [],
    createdAt: "2024-03-01",
    lat: -29.785,
    lng: -50.07,
    decorated: true,
    seaView: true,
    acceptsExchange: true,
    paymentConditions: ["60x", "Permuta"],
    empreendimento: "Ed. Alto Padrão Atlântida",
    unitNumber: "Ap 801",
    boxNumber: "Box 25, 26",
  },
];

// Empreendimento metadata
const empreendimentoInfo: Record<
  string,
  {
    description: string;
    address: string;
    city: string;
    features: string[];
    photos: string[];
    coverPhoto: string;
    totalUnits?: number;
    floors?: number;
    yearBuilt?: string;
  }
> = {
  "Ed. Atlântico Sul": {
    description:
      "O Edifício Atlântico Sul é referência em sofisticação no litoral gaúcho. Com localização privilegiada à beira-mar, oferece apartamentos amplos com acabamento de alto padrão, vista permanente para o mar e infraestrutura completa de lazer.",
    address: "Av. Beira Mar, 1200",
    city: "Capão da Canoa",
    features: ["Piscina aquecida", "Salão de festas", "Academia", "Churrasqueira", "Playground", "Segurança 24h", "Garagem coberta"],
    photos: [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop",
    ],
    coverPhoto: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=600&fit=crop",
    totalUnits: 48,
    floors: 12,
    yearBuilt: "2022",
  },
  "Ed. Panorama Beach": {
    description:
      "O Ed. Panorama Beach é um empreendimento exclusivo com coberturas duplex e vista panorâmica para o mar. Localizado em uma das ruas mais valorizadas de Capão da Canoa.",
    address: "Rua Sepé, 500",
    city: "Capão da Canoa",
    features: ["Vista panorâmica", "Piscina infinita", "Espaço gourmet", "Sauna", "Bicicletário", "Portaria 24h"],
    photos: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop",
    ],
    coverPhoto: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=600&fit=crop",
    totalUnits: 24,
    floors: 15,
    yearBuilt: "2023",
  },
  "Cond. Reserva das Dunas": {
    description:
      "O Condomínio Reserva das Dunas é um condomínio horizontal de alto padrão em Xangri-lá, cercado por natureza e próximo à praia. Lotes amplos e infraestrutura completa.",
    address: "Rua das Hortênsias, 300",
    city: "Xangri-lá",
    features: ["Pórtico com segurança", "Ruas pavimentadas", "Praça central", "Área verde preservada", "Trilha ecológica"],
    photos: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800&h=600&fit=crop",
    ],
    coverPhoto: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=600&fit=crop",
    totalUnits: 80,
    yearBuilt: "2021",
  },
  "Centro Comercial Capão": {
    description:
      "O Centro Comercial Capão é o principal ponto comercial de Capão da Canoa, com salas e lojas para diversos segmentos.",
    address: "Av. Paraguassú, 800",
    city: "Capão da Canoa",
    features: ["Estacionamento rotativo", "Elevadores", "Acessibilidade", "Próximo ao centro"],
    photos: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop",
    ],
    coverPhoto: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=600&fit=crop",
    totalUnits: 40,
    floors: 5,
    yearBuilt: "2018",
  },
  "Cond. Bosque do Litoral": {
    description:
      "Condomínio com lotes em meio a um bosque preservado no litoral norte gaúcho. Ideal para quem busca tranquilidade e contato com a natureza.",
    address: "Rua dos Coqueiros, 150",
    city: "Xangri-lá",
    features: ["Bosque preservado", "Segurança 24h", "Área de lazer", "Quadra poliesportiva"],
    photos: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1500076656116-558758c991c1?w=800&h=600&fit=crop",
    ],
    coverPhoto: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&h=600&fit=crop",
    totalUnits: 60,
    yearBuilt: "2020",
  },
  "Residencial Atlântida": {
    description:
      "Residencial localizado na Praia de Atlântida com apartamentos modernos e boa infraestrutura. Próximo a comércios e restaurantes.",
    address: "Av. Central, 200",
    city: "Xangri-lá",
    features: ["Piscina", "Salão de festas", "Churrasqueira", "Playground"],
    photos: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop",
    ],
    coverPhoto: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=600&fit=crop",
    totalUnits: 32,
    floors: 8,
    yearBuilt: "2019",
  },
  "Ed. Navegantes": {
    description:
      "Edifício com apartamentos funcionais e vista mar, localizado na avenida principal de Capão da Canoa. Excelente custo-benefício para investimento ou moradia.",
    address: "Av. Beira Mar, 1800",
    city: "Capão da Canoa",
    features: ["Vista mar", "Elevador", "Portaria eletrônica", "Garagem"],
    photos: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&h=600&fit=crop",
    ],
    coverPhoto: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=600&fit=crop",
    totalUnits: 30,
    floors: 10,
    yearBuilt: "2021",
  },
  "Ed. Alto Padrão Atlântida": {
    description:
      "Empreendimento de alto padrão na Praia de Atlântida, com acabamentos premium e infraestrutura completa de lazer e segurança.",
    address: "Av. Atlântida, 600",
    city: "Xangri-lá",
    features: ["Alto padrão", "Piscina aquecida", "Spa", "Academia", "Salão gourmet", "Segurança 24h"],
    photos: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
    ],
    coverPhoto: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=600&fit=crop",
    totalUnits: 20,
    floors: 14,
    yearBuilt: "2024",
  },
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function empreendimentoSlug(name: string) {
  return slugify(name);
}

export default function EmpreendimentoDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Find empreendimento by slug
  const empName = Object.keys(empreendimentoInfo).find(
    (name) => slugify(name) === slug
  );

  const info = empName ? empreendimentoInfo[empName] : null;
  const empProperties = allProperties.filter(
    (p) => p.empreendimento && slugify(p.empreendimento) === slug
  );

  if (!info || !empName) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Building2 className="w-12 h-12 mx-auto text-gray-300" />
          <p className="text-gray-500 text-lg">Empreendimento não encontrado</p>
          <Link to="/site" className="text-amber-600 font-bold hover:underline">
            ← Voltar ao site
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        <img
          src={info.coverPhoto}
          alt={empName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute top-4 left-4">
          <Link
            to="/site"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 backdrop-blur text-gray-800 text-sm font-semibold hover:bg-white transition-colors shadow"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
        </div>
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-2xl sm:text-4xl font-black text-white drop-shadow-lg">
            {empName}
          </h1>
          <div className="flex items-center gap-2 mt-2 text-white/90 text-sm">
            <MapPin className="w-4 h-4" />
            <span>
              {info.address}, {info.city}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Info cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {info.totalUnits && (
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
              <Home className="w-5 h-5 mx-auto text-amber-500 mb-1" />
              <p className="text-2xl font-black text-gray-900">{info.totalUnits}</p>
              <p className="text-xs text-gray-500">Unidades</p>
            </div>
          )}
          {info.floors && (
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
              <Building2 className="w-5 h-5 mx-auto text-amber-500 mb-1" />
              <p className="text-2xl font-black text-gray-900">{info.floors}</p>
              <p className="text-xs text-gray-500">Andares</p>
            </div>
          )}
          {info.yearBuilt && (
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
              <Camera className="w-5 h-5 mx-auto text-amber-500 mb-1" />
              <p className="text-2xl font-black text-gray-900">{info.yearBuilt}</p>
              <p className="text-xs text-gray-500">Ano</p>
            </div>
          )}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
            <MapPin className="w-5 h-5 mx-auto text-amber-500 mb-1" />
            <p className="text-lg font-bold text-gray-900">{info.city}</p>
            <p className="text-xs text-gray-500">Cidade</p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Sobre o Empreendimento</h2>
          <p className="text-gray-600 leading-relaxed">{info.description}</p>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Infraestrutura</h2>
          <div className="flex flex-wrap gap-2">
            {info.features.map((f) => (
              <span
                key={f}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-amber-50 text-amber-700 border border-amber-100"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Photos */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-500" /> Fotos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {info.photos.map((photo, idx) => (
              <button
                key={idx}
                onClick={() => setLightboxIndex(idx)}
                className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer"
              >
                <img
                  src={photo}
                  alt={`${empName} - Foto ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Properties */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" /> Imóveis Disponíveis
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {empProperties.length} imóve{empProperties.length === 1 ? "l" : "is"} cadastrado
            {empProperties.length === 1 ? "" : "s"} neste empreendimento
          </p>
          {empProperties.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-gray-100 text-center text-gray-400">
              Nenhum imóvel cadastrado neste empreendimento
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {empProperties.map((property) => (
                <div
                  key={property.id}
                  className="group rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={property.image}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-3 left-3">
                      <p className="text-xl font-bold text-white drop-shadow-lg">
                        {formatCurrency(property.price)}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-gray-900 text-base">{property.title}</h3>
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{property.address}, {property.city}</span>
                    </div>
                    {(property.unitNumber || property.boxNumber || property.quadra || property.lote) && (
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
                        {property.unitNumber && (
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 font-semibold">{property.unitNumber}</span>
                        )}
                        {property.boxNumber && (
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 font-semibold">{property.boxNumber}</span>
                        )}
                        {property.quadra && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold">{property.quadra}</span>
                        )}
                        {property.lote && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold">{property.lote}</span>
                        )}
                      </div>
                    )}
                    {(property.bedrooms > 0 || property.area > 0) && (
                      <div className="flex items-center gap-4 pt-2 border-t border-gray-100 text-xs text-gray-600">
                        <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" />{property.area}m²</span>
                        {property.bedrooms > 0 && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{property.bedrooms}</span>}
                        {property.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{property.bathrooms}</span>}
                        {property.parking > 0 && <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5" />{property.parking}</span>}
                      </div>
                    )}
                    {property.paymentConditions && property.paymentConditions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {property.paymentConditions.map((cond) => (
                          <span key={cond} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            {cond}
                          </span>
                        ))}
                      </div>
                    )}
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        property.status === "Disponível"
                          ? "bg-green-100 text-green-700"
                          : property.status === "Reservado"
                          ? "bg-yellow-100 text-yellow-700"
                          : property.status === "Vendido"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {property.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
          >
            <X className="w-6 h-6" />
          </button>
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
              className="absolute left-4 text-white/80 hover:text-white z-10"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}
          {lightboxIndex < info.photos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
              className="absolute right-4 text-white/80 hover:text-white z-10"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
          <img
            src={info.photos[lightboxIndex]}
            alt={`${empName} - Foto ${lightboxIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
