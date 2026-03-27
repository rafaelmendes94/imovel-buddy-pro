import { useState } from "react";
import { Link } from "react-router-dom";
import { X, MapPin, BedDouble, Bath, Car, Ruler, Phone, Waves, Paintbrush, Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency, type Property } from "@/data/mockData";

interface PropertyDetailModalProps {
  property: Property | null;
  onClose: () => void;
  allProperties: Property[];
  brokerInfo?: Record<string, { photo: string; whatsapp: string }>;
  onSelectSimilar?: (p: Property) => void;
}

export function PropertyDetailModal({ property, onClose, allProperties, brokerInfo, onSelectSimilar }: PropertyDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!property) return null;

  const images = property.images && property.images.length > 0 ? property.images : [property.image];
  const unitParts = [property.unitNumber, property.boxNumber, property.quadra, property.lote].filter(Boolean);
  const broker = brokerInfo?.[property.broker];
  const whatsappMessage = encodeURIComponent(`Olá! Tenho interesse no imóvel: ${property.title} - ${formatCurrency(property.price)}`);

  // Find similar properties: same type or same city, exclude current
  const similar = allProperties
    .filter((p) => p.id !== property.id && (p.type === property.type || p.city === property.city))
    .slice(0, 6);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 pt-8 pb-8" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        {/* Header with close */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 truncate pr-4">{property.title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Image gallery */}
        <div className="relative h-64 sm:h-80 bg-gray-100">
          <img
            src={images[currentImageIndex]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
          {images.length > 1 && (
            <>
              {currentImageIndex > 0 && (
                <button
                  onClick={() => setCurrentImageIndex(currentImageIndex - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              {currentImageIndex < images.length - 1 && (
                <button
                  onClick={() => setCurrentImageIndex(currentImageIndex + 1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${i === currentImageIndex ? "bg-white" : "bg-white/50"}`}
                  />
                ))}
              </div>
            </>
          )}
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white uppercase tracking-wide">
              {property.status}
            </span>
            {property.seaView && (
              <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-blue-500/90 text-white flex items-center gap-1">
                <Waves className="w-3 h-3" /> Vista Mar
              </span>
            )}
            {property.decorated && (
              <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-purple-500/90 text-white flex items-center gap-1">
                <Paintbrush className="w-3 h-3" /> Decorado
              </span>
            )}
          </div>
          <div className="absolute bottom-3 right-3">
            <p className="text-2xl font-black text-white drop-shadow-lg">{formatCurrency(property.price)}</p>
          </div>
        </div>

        {/* Property details */}
        <div className="p-5 space-y-4">
          {/* Empreendimento + unit inline */}
          {(property.empreendimento || unitParts.length > 0) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {property.empreendimento && (
                <Link
                  to={`/empreendimento/${property.empreendimento.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`}
                  className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md hover:bg-amber-100 transition-colors"
                  onClick={onClose}
                >
                  {property.empreendimento}
                </Link>
              )}
              {unitParts.map((part) => (
                <span key={part} className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">
                  {part}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-gray-500 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{property.address}, {property.city}</span>
          </div>

          {/* Specs grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Ruler className="w-4 h-4 mx-auto text-amber-500 mb-1" />
              <p className="text-lg font-bold text-gray-900">{property.area}m²</p>
              <p className="text-[10px] text-gray-500">Área</p>
            </div>
            {property.bedrooms > 0 && (
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <BedDouble className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                <p className="text-lg font-bold text-gray-900">{property.bedrooms}</p>
                <p className="text-[10px] text-gray-500">Quartos</p>
              </div>
            )}
            {property.bathrooms > 0 && (
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <Bath className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                <p className="text-lg font-bold text-gray-900">{property.bathrooms}</p>
                <p className="text-[10px] text-gray-500">Banheiros</p>
              </div>
            )}
            {property.parking > 0 && (
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <Car className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                <p className="text-lg font-bold text-gray-900">{property.parking}</p>
                <p className="text-[10px] text-gray-500">Vagas</p>
              </div>
            )}
          </div>

          {/* Payment conditions */}
          {property.paymentConditions && property.paymentConditions.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Condições de Pagamento</p>
              <div className="flex flex-wrap gap-2">
                {property.paymentConditions.map((cond) => (
                  <span key={cond} className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {cond}
                  </span>
                ))}
                {property.paymentConditionsOther && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                    {property.paymentConditionsOther}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Broker + WhatsApp */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            {broker ? (
              <Link
                to={`/corretor/${property.broker.toLowerCase().replace(/\s+/g, "-")}`}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                onClick={onClose}
              >
                <img src={broker.photo} alt={property.broker} className="w-10 h-10 rounded-full object-cover border-2 border-amber-400" />
                <div>
                  <p className="text-sm font-semibold text-amber-700 hover:underline">{property.broker}</p>
                  <p className="text-[10px] text-gray-400">Corretor(a)</p>
                </div>
              </Link>
            ) : (
              <p className="text-sm text-gray-600">{property.broker}</p>
            )}
            <a
              href={`https://wa.me/${broker?.whatsapp || "5511999999999"}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm"
            >
              <Phone className="w-4 h-4" /> WhatsApp
            </a>
          </div>
        </div>

        {/* Similar properties */}
        {similar.length > 0 && (
          <div className="border-t border-gray-100 p-5">
            <h3 className="text-base font-bold text-gray-900 mb-4">Imóveis Similares</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {similar.map((sp) => (
                <button
                  key={sp.id}
                  onClick={() => {
                    setCurrentImageIndex(0);
                    onSelectSimilar?.(sp);
                  }}
                  className="rounded-xl overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors text-left border border-gray-100"
                >
                  <div className="relative h-28 overflow-hidden">
                    <img src={sp.image} alt={sp.title} className="w-full h-full object-cover" />
                    <div className="absolute bottom-1.5 left-1.5">
                      <p className="text-sm font-bold text-white drop-shadow-lg">{formatCurrency(sp.price)}</p>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-gray-900 line-clamp-1">{sp.title}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{sp.city} · {sp.area}m²</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
