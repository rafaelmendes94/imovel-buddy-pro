import { useState } from "react";
import { Link } from "react-router-dom";
import {
  X, MapPin, BedDouble, Bath, Car, Ruler, Phone, Waves, Paintbrush,
  Building2, ChevronLeft, ChevronRight, ExternalLink, Play, Repeat,
  CreditCard, Navigation, Share2, Heart, Maximize2
} from "lucide-react";
import { formatCurrency, type Property } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface PropertyDetailModalProps {
  property: Property | null;
  onClose: () => void;
  allProperties: Property[];
  brokerInfo?: Record<string, { photo: string; whatsapp: string }>;
  onSelectSimilar?: (p: Property) => void;
}

export function PropertyDetailModal({ property, onClose, allProperties, brokerInfo, onSelectSimilar }: PropertyDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  if (!property) return null;

  const images = property.images && property.images.length > 0 ? property.images : [property.image];
  const unitParts = [property.unitNumber, property.boxNumber, property.quadra, property.lote].filter(Boolean);
  const broker = brokerInfo?.[property.broker];
  const whatsappMessage = encodeURIComponent(`Olá! Tenho interesse no imóvel: ${property.title} - ${formatCurrency(property.price)}`);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.address}, ${property.city}`)}`;

  // Mock video URL (placeholder)
  const videoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ";

  // Find similar properties
  const similar = allProperties
    .filter((p) => p.id !== property.id && (p.type === property.type || p.city === property.city))
    .slice(0, 6);

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };
  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 pt-6 pb-8" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate">{property.title}</h2>
            <span className={cn(
              "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide flex-shrink-0",
              property.status === "Disponível" ? "bg-emerald-500 text-white" :
              property.status === "Vendido" ? "bg-red-500 text-white" :
              property.status === "Reservado" ? "bg-amber-500 text-white" :
              "bg-blue-500 text-white"
            )}>
              {property.status}
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Main image gallery with arrows */}
        <div className="relative h-72 sm:h-96 bg-gray-900">
          <img
            src={images[currentImageIndex]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

          {/* Navigation arrows - always visible */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all hover:scale-105"
              >
                <ChevronLeft className="w-5 h-5 text-gray-800" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all hover:scale-105"
              >
                <ChevronRight className="w-5 h-5 text-gray-800" />
              </button>
            </>
          )}

          {/* Image counter */}
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/50 text-white text-xs font-bold backdrop-blur-sm">
            {currentImageIndex + 1} / {images.length}
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
            {property.seaView && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/90 text-white flex items-center gap-1 backdrop-blur-sm">
                <Waves className="w-3 h-3" /> Vista Mar
              </span>
            )}
            {property.decorated && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/90 text-white flex items-center gap-1 backdrop-blur-sm">
                <Paintbrush className="w-3 h-3" /> Decorado
              </span>
            )}
            {property.acceptsExchange && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-500/90 text-white flex items-center gap-1 backdrop-blur-sm">
                <Repeat className="w-3 h-3" /> Aceita Permuta
              </span>
            )}
          </div>

          {/* Price */}
          <div className="absolute bottom-3 left-3">
            <p className="text-3xl font-black text-white drop-shadow-lg">{formatCurrency(property.price)}</p>
          </div>

          {/* Thumbnail dots */}
          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i); }}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all",
                    i === currentImageIndex ? "bg-white w-5" : "bg-white/50 hover:bg-white/80"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex gap-1 p-2 bg-gray-50 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrentImageIndex(i)}
                className={cn(
                  "flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all",
                  i === currentImageIndex ? "border-amber-500 opacity-100" : "border-transparent opacity-60 hover:opacity-90"
                )}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5">

          {/* Empreendimento + Unit Info */}
          {(property.empreendimento || unitParts.length > 0) && (
            <div className="flex flex-wrap items-center gap-2">
              {property.empreendimento && (
                <Link
                  to={`/empreendimento/${property.empreendimento.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`}
                  className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1.5"
                  onClick={onClose}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  {property.empreendimento}
                </Link>
              )}
              {unitParts.map((part) => (
                <span key={part} className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                  {part}
                </span>
              ))}
            </div>
          )}

          {/* Location - clickable to Google Maps */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <MapPin className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium">{property.address}, {property.city}</p>
              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                <Navigation className="w-3 h-3" /> Clique para abrir no Google Maps
              </p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400 ml-auto" />
          </a>

          {/* Specs grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
              <Ruler className="w-5 h-5 mx-auto text-amber-500 mb-1.5" />
              <p className="text-xl font-bold text-gray-900">{property.area}m²</p>
              <p className="text-[11px] text-gray-500 font-medium">Área Total</p>
            </div>
            {property.bedrooms > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                <BedDouble className="w-5 h-5 mx-auto text-amber-500 mb-1.5" />
                <p className="text-xl font-bold text-gray-900">{property.bedrooms}</p>
                <p className="text-[11px] text-gray-500 font-medium">Quartos</p>
              </div>
            )}
            {property.bathrooms > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                <Bath className="w-5 h-5 mx-auto text-amber-500 mb-1.5" />
                <p className="text-xl font-bold text-gray-900">{property.bathrooms}</p>
                <p className="text-[11px] text-gray-500 font-medium">Banheiros</p>
              </div>
            )}
            {property.parking > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                <Car className="w-5 h-5 mx-auto text-amber-500 mb-1.5" />
                <p className="text-xl font-bold text-gray-900">{property.parking}</p>
                <p className="text-[11px] text-gray-500 font-medium">Vagas</p>
              </div>
            )}
          </div>

          {/* Descrição */}
          {property.description && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Descrição</p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>
          )}

          {/* Features tags */}
          <div className="flex flex-wrap gap-2">
            {property.type && (
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700">
                {property.type}
              </span>
            )}
            {property.seaView && (
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 flex items-center gap-1">
                <Waves className="w-3 h-3" /> Vista para o Mar
              </span>
            )}
            {property.decorated && (
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 flex items-center gap-1">
                <Paintbrush className="w-3 h-3" /> Decorado / Mobiliado
              </span>
            )}
            {property.acceptsExchange && (
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-50 text-orange-700 flex items-center gap-1">
                <Repeat className="w-3 h-3" /> Aceita Permuta
              </span>
            )}
          </div>

          {/* Payment conditions */}
          {property.paymentConditions && property.paymentConditions.length > 0 && (
            <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> Condições de Pagamento
              </p>
              <div className="flex flex-wrap gap-2">
                {property.paymentConditions.map((cond) => (
                  <span key={cond} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-emerald-700 border border-emerald-200 shadow-sm">
                    {cond}
                  </span>
                ))}
                {property.paymentConditionsOther && (
                  <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-gray-600 border border-gray-200">
                    {property.paymentConditionsOther}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Video section */}
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <button
              onClick={() => setShowVideo(!showVideo)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-bold text-gray-800">
                <Play className="w-4 h-4 text-red-500" /> Vídeo do Imóvel
              </span>
              <ChevronRight className={cn("w-4 h-4 text-gray-400 transition-transform", showVideo && "rotate-90")} />
            </button>
            {showVideo && (
              <div className="aspect-video bg-black">
                <iframe
                  src={videoUrl}
                  title="Vídeo do imóvel"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>

          {/* Broker + WhatsApp */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            {broker ? (
              <Link
                to={`/corretor/${property.broker.toLowerCase().replace(/\s+/g, "-")}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                onClick={onClose}
              >
                <img src={broker.photo} alt={property.broker} className="w-12 h-12 rounded-full object-cover border-2 border-amber-400" />
                <div>
                  <p className="text-sm font-bold text-amber-700 hover:underline">{property.broker}</p>
                  <p className="text-[11px] text-gray-400">Corretor(a) responsável</p>
                </div>
              </Link>
            ) : (
              <p className="text-sm text-gray-600 font-medium">{property.broker}</p>
            )}
            <div className="flex items-center gap-2">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-colors shadow-sm"
              >
                <MapPin className="w-4 h-4" /> Mapa
              </a>
              <a
                href={`https://wa.me/${broker?.whatsapp || "5511999999999"}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm"
              >
                <Phone className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Similar properties with image carousel */}
        {similar.length > 0 && (
          <div className="border-t border-gray-100 p-5 sm:p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">Imóveis Similares</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {similar.map((sp) => (
                <SimilarCard
                  key={sp.id}
                  property={sp}
                  onSelect={() => {
                    setCurrentImageIndex(0);
                    setShowVideo(false);
                    onSelectSimilar?.(sp);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SimilarCard({ property, onSelect }: { property: Property; onSelect: () => void }) {
  const [imgIndex, setImgIndex] = useState(0);
  const imgs = property.images && property.images.length > 0 ? property.images : [property.image];

  return (
    <button
      onClick={onSelect}
      className="rounded-xl overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors text-left border border-gray-100 group"
    >
      <div className="relative h-28 overflow-hidden">
        <img src={imgs[imgIndex]} alt={property.title} className="w-full h-full object-cover" />
        {imgs.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setImgIndex((prev) => (prev > 0 ? prev - 1 : imgs.length - 1)); }}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setImgIndex((prev) => (prev < imgs.length - 1 ? prev + 1 : 0)); }}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </>
        )}
        <div className="absolute bottom-1.5 left-1.5">
          <p className="text-sm font-bold text-white drop-shadow-lg">{formatCurrency(property.price)}</p>
        </div>
      </div>
      <div className="p-2.5">
        <p className="text-xs font-semibold text-gray-900 line-clamp-1">{property.title}</p>
        <p className="text-[10px] text-gray-500 mt-0.5">{property.city} · {property.area}m²</p>
      </div>
    </button>
  );
}
