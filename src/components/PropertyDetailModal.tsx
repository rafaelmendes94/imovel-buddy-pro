import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  X, MapPin, BedDouble, Bath, Car, Ruler, Phone, Waves, Paintbrush,
  Building2, ChevronLeft, ChevronRight, ExternalLink, Play, Repeat,
  CreditCard, Navigation, Share2, Heart, Maximize2, Download, Key,
  Pencil, Check, HardDrive, Flame, TrendingUp, Eye, EyeOff, User,
  Sparkles, Loader2, Target, Zap, FileText, MapPinned, DollarSign,
  Gift, Percent, FileCheck, Hash, Scan
} from "lucide-react";
import { formatCurrency, type Property } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PropertyDetailModalProps {
  property: Property | null;
  onClose: () => void;
  allProperties: Property[];
  brokerInfo?: Record<string, { photo: string; whatsapp: string }>;
  onSelectSimilar?: (p: Property) => void;
  onUpdateProperty?: (updated: Property) => void;
  onFilterByTitle?: (title: string) => void;
  onFilterByCondition?: (cond: string) => void;
}

export function PropertyDetailModal({ property, onClose, allProperties, brokerInfo, onSelectSimilar, onUpdateProperty, onFilterByTitle, onFilterByCondition }: PropertyDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [showOwnerPhone, setShowOwnerPhone] = useState(false);
  const [generatingAI, setGeneratingAI] = useState<string | null>(null);
  const [showAIOptions, setShowAIOptions] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  if (!property) return null;

  const images = property.images && property.images.length > 0 ? property.images : [property.image];
  const unitParts = [property.unitNumber, property.boxNumber, property.quadra, property.lote].filter(Boolean);
  const broker = brokerInfo?.[property.broker];
  const whatsappMessage = encodeURIComponent(`Olá! Tenho interesse no imóvel: ${property.title} - ${formatCurrency(property.price)}`);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.address}, ${property.city}`)}`;
  const videoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ";

  const ownerProperties = allProperties
    .filter((p) => p.id !== property.id && p.owner && property.owner && p.owner === property.owner)
    .slice(0, 6);

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };
  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  // -- Inline edit helpers --
  const startEdit = (field: string, currentValue: string | number) => {
    setEditingField(field);
    setEditValues((prev) => ({ ...prev, [field]: String(currentValue) }));
  };

  const saveEdit = (field: string) => {
    if (!onUpdateProperty) {
      toast.info("Edição salva localmente");
    } else {
      const val = editValues[field];
      const updated = { ...property };
      switch (field) {
        case "title": updated.title = val; break;
        case "code": updated.code = val; break;
        case "price": updated.price = Number(val) || property.price; break;
        case "priceInstallment": updated.priceInstallment = Number(val) || 0; break;
        case "address": updated.address = val; break;
        case "city": updated.city = val; break;
        case "neighborhood": updated.neighborhood = val; break;
        case "area": updated.area = Number(val) || property.area; break;
        case "privateArea": updated.privateArea = Number(val) || 0; break;
        case "bedrooms": updated.bedrooms = Number(val) || 0; break;
        case "bathrooms": updated.bathrooms = Number(val) || 0; break;
        case "parking": updated.parking = Number(val) || 0; break;
        case "description": updated.description = val; break;
        case "posicaoPredio": updated.posicaoPredio = val; break;
        case "posicaoSolar": updated.posicaoSolar = val; break;
        case "vista": updated.vista = val; break;
        case "condicao": updated.condicao = val as Property["condicao"]; break;
        case "infraestrutura": updated.infraestrutura = val.split(",").map(s => s.trim()).filter(Boolean); break;
        case "empreendimento": updated.empreendimento = val || undefined; break;
        case "unitNumber": updated.unitNumber = val || undefined; break;
        case "boxNumber": updated.boxNumber = val || undefined; break;
        case "quadra": updated.quadra = val || undefined; break;
        case "lote": updated.lote = val || undefined; break;
        case "keysLocation": updated.keysLocation = val || undefined; break;
        case "exclusivityTerm": updated.exclusivityTerm = val || undefined; break;
        case "owner": updated.owner = val || undefined; break;
        case "ownerPhone": updated.ownerPhone = val || undefined; break;
        case "broker": updated.broker = val; break;
        case "commission": updated.commission = Number(val) || undefined; break;
        case "bonus": updated.bonus = Number(val) || undefined; break;
        case "bonusExpiry": updated.bonusExpiry = val || undefined; break;
      }
      updateProperty(updated);
      toast.success("Informação atualizada!");
    }
    setEditingField(null);
  };

  const cancelEdit = () => setEditingField(null);

  // Wrapper to track changes
  const updateProperty = (updated: Property) => {
    if (onUpdateProperty) {
      onUpdateProperty(updated);
      setHasChanges(true);
    }
  };

  // -- Confirm update (stamp updatedAt) --
  const handleConfirmUpdate = () => {
    if (onUpdateProperty && hasChanges) {
      onUpdateProperty({ ...property, updatedAt: new Date().toISOString() });
      setHasChanges(false);
      toast.success("Imóvel atualizado! Data de atualização registrada.");
    }
  };

  // -- Close with auto-update --
  const handleClose = () => {
    if (hasChanges && onUpdateProperty) {
      onUpdateProperty({ ...property, updatedAt: new Date().toISOString() });
      toast.success("Alterações salvas e data atualizada.");
    }
    onClose();
  };

  // -- AI Description Generation --
  const aiStyles = [
    { id: "gatilhos", label: "Gatilhos de Venda", icon: Target, color: "text-red-500 bg-red-50 border-red-200 hover:bg-red-100" },
    { id: "agressiva", label: "Agressiva (Vendas)", icon: Zap, color: "text-orange-500 bg-orange-50 border-orange-200 hover:bg-orange-100" },
    { id: "informativa", label: "Informativa Completa", icon: FileText, color: "text-blue-500 bg-blue-50 border-blue-200 hover:bg-blue-100" },
    { id: "geolocalizacao", label: "Geolocalização", icon: MapPinned, color: "text-emerald-500 bg-emerald-50 border-emerald-200 hover:bg-emerald-100" },
  ];

  const handleGenerateDescription = async (style: string) => {
    setGeneratingAI(style);
    try {
      const { data, error } = await supabase.functions.invoke("generate-description", {
        body: { property, style },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.description) {
        setEditValues((prev) => ({ ...prev, description: data.description }));
        setEditingField("description");
        setShowAIOptions(false);
        toast.success("Descrição gerada com IA! Revise e salve.");
      }
    } catch (e: any) {
      console.error("AI description error:", e);
      toast.error(e?.message || "Erro ao gerar descrição com IA");
    } finally {
      setGeneratingAI(null);
    }
  };

  // -- Share --
  const handleShare = async () => {
    const shareData = {
      title: property.title,
      text: `${property.title} - ${formatCurrency(property.price)}\n${property.address}, ${property.city}\n${property.bedrooms} quartos • ${property.area}m²`,
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  // -- Download ficha --
  const handleDownload = () => {
    const content = `
═══════════════════════════════════════
       FICHA DO IMÓVEL
═══════════════════════════════════════

Título: ${property.title}
Tipo: ${property.type}
Status: ${property.status}
Preço: ${formatCurrency(property.price)}

LOCALIZAÇÃO
Endereço: ${property.address}
Cidade: ${property.city}

CARACTERÍSTICAS
Área: ${property.area}m²
Quartos: ${property.bedrooms}
Banheiros: ${property.bathrooms}
Vagas: ${property.parking}
${property.seaView ? "✓ Vista para o Mar" : ""}
${property.decorated ? "✓ Decorado / Mobiliado" : ""}
${property.acceptsExchange ? "✓ Aceita Permuta" : ""}

${property.description ? `DESCRIÇÃO\n${property.description}` : ""}

${property.paymentConditions?.length ? `CONDIÇÕES DE PAGAMENTO\n${property.paymentConditions.join(", ")}` : ""}

Corretor: ${property.broker}
${property.empreendimento ? `Empreendimento: ${property.empreendimento}` : ""}

═══════════════════════════════════════
    `.trim();

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ficha_${property.title.replace(/\s+/g, "_").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Ficha do imóvel baixada!");
  };

  // -- Download from Drive (keys) --
  const handleDriveDownload = () => {
    toast.info("Abrindo pasta de chaves no Drive...", { description: "Conecte sua conta do Google Drive para acessar os documentos do imóvel." });
    // Simulate opening drive folder for keys
    window.open(`https://drive.google.com/drive/search?q=${encodeURIComponent(property.title + " chaves")}`, "_blank");
  };

  // -- Editable field component --
  const EditableField = ({ field, value, label, type = "text", className = "" }: { field: string; value: string | number; label?: string; type?: string; className?: string }) => {
    if (editingField === field) {
      return (
        <div className="flex items-center gap-1.5">
          <input
            type={type}
            value={editValues[field] ?? String(value)}
            onChange={(e) => setEditValues((prev) => ({ ...prev, [field]: e.target.value }))}
            className="bg-white border border-amber-300 rounded px-2 py-1 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400 min-w-0"
            style={{ width: Math.max(80, String(editValues[field] ?? value).length * 9) }}
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(field); if (e.key === "Escape") cancelEdit(); }}
          />
          <button onClick={() => saveEdit(field)} className="w-6 h-6 rounded bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={cancelEdit} className="w-6 h-6 rounded bg-gray-300 text-gray-600 flex items-center justify-center hover:bg-gray-400 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }
    return (
      <span className={cn("group/edit inline-flex items-center gap-1 cursor-pointer hover:bg-amber-50 rounded px-1 -mx-1 transition-colors", className)}
        onClick={(e) => { e.stopPropagation(); startEdit(field, value); }}
        title={`Clique para editar ${label || field}`}
      >
        {type === "number" && field === "price" ? formatCurrency(Number(value)) : value}
        <Pencil className="w-3 h-3 text-amber-400 opacity-0 group-hover/edit:opacity-100 transition-opacity flex-shrink-0" />
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-start justify-center overflow-y-auto p-2 sm:p-4 pt-4 sm:pt-6 pb-6 sm:pb-8" onClick={handleClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <h2 className="text-lg font-bold text-gray-900 truncate">
              <span
                className="cursor-pointer hover:text-amber-600 transition-colors"
                onClick={() => onFilterByTitle?.(property.title)}
                title="Clique para ver títulos semelhantes"
              >
                <EditableField field="title" value={property.title} label="título" />
              </span>
            </h2>
            {property.code && (
              <span className="text-[11px] font-black text-gray-500 bg-gray-100 px-2 py-0.5 rounded flex-shrink-0">
                <EditableField field="code" value={property.code} label="código" />
              </span>
            )}
            <select
              value={property.status}
              onChange={(e) => {
                if (onUpdateProperty) {
                  updateProperty({ ...property, status: e.target.value as Property["status"] });
                  toast.success("Status atualizado!");
                }
              }}
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide flex-shrink-0 cursor-pointer border-0 focus:outline-none focus:ring-2 focus:ring-amber-400",
                property.status === "Disponível" ? "bg-emerald-500 text-white" :
                property.status === "Vendido" ? "bg-red-500 text-white" :
                property.status === "Reservado" ? "bg-amber-500 text-white" :
                property.status === "Alugado" ? "bg-blue-500 text-white" :
                "bg-gray-500 text-white"
              )}
            >
              {(["Disponível", "Vendido", "Reservado", "Alugado", "Suspenso"] as const).map(s => (
                <option key={s} value={s} className="text-gray-900 bg-white">{s}</option>
              ))}
            </select>
          </div>
          {/* Action buttons in header */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={handleShare} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-amber-600" title="Compartilhar">
              <Share2 className="w-4.5 h-4.5" />
            </button>
            <button onClick={handleDownload} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-blue-600" title="Baixar ficha">
              <Download className="w-4.5 h-4.5" />
            </button>
            <button onClick={handleDriveDownload} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-purple-600" title="Baixar do Drive (Chaves)">
              <Key className="w-4.5 h-4.5" />
            </button>
            <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Main image gallery */}
        <div className="relative h-72 sm:h-96 bg-gray-900">
          <img src={images[currentImageIndex]} alt={property.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

          {images.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all hover:scale-105">
                <ChevronLeft className="w-5 h-5 text-gray-800" />
              </button>
              <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all hover:scale-105">
                <ChevronRight className="w-5 h-5 text-gray-800" />
              </button>
            </>
          )}

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

          {/* Price - editable */}
          <div className="absolute bottom-3 left-3">
            <p className="text-3xl font-black text-white drop-shadow-lg">
              <EditableField field="price" value={property.price} label="preço" type="number" className="text-white hover:bg-white/20" />
            </p>
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 flex gap-1.5">
              {images.map((_, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i); }}
                  className={cn("w-2.5 h-2.5 rounded-full transition-all", i === currentImageIndex ? "bg-white w-5" : "bg-white/50 hover:bg-white/80")}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex gap-1 p-2 bg-gray-50 overflow-x-auto">
            {images.map((img, i) => (
              <button key={i} onClick={() => setCurrentImageIndex(i)}
                className={cn("flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all",
                  i === currentImageIndex ? "border-amber-500 opacity-100" : "border-transparent opacity-60 hover:opacity-90"
                )}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-2 px-5 py-3 bg-amber-50/50 border-b border-amber-100">
          <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <Share2 className="w-4 h-4 text-amber-500" /> Compartilhar
          </button>
          <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <Download className="w-4 h-4 text-blue-500" /> Baixar Ficha
          </button>
          <button onClick={handleDriveDownload} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <Key className="w-4 h-4 text-purple-500" /> Chaves / Drive
          </button>
        </div>

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

          {/* Location - editable */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <MapPin className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0" onClick={(e) => e.preventDefault()}>
              <div className="text-sm font-medium">
                <EditableField field="address" value={property.address} label="endereço" /> ,{" "}
                <EditableField field="city" value={property.city} label="cidade" />
              </div>
              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                <Navigation className="w-3 h-3" /> Clique para abrir no Google Maps
              </p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400 ml-auto flex-shrink-0" />
          </a>

          {/* Specs grid - editable */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
              <Maximize2 className="w-5 h-5 mx-auto text-amber-500 mb-1.5" />
              <p className="text-xl font-bold text-gray-900">
                <EditableField field="area" value={property.area} label="área" type="number" />m²
              </p>
              <p className="text-[11px] text-gray-500 font-medium">Área Total</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
              <BedDouble className="w-5 h-5 mx-auto text-amber-500 mb-1.5" />
              <p className="text-xl font-bold text-gray-900">
                <EditableField field="bedrooms" value={property.bedrooms} label="quartos" type="number" />
              </p>
              <p className="text-[11px] text-gray-500 font-medium">Quartos</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
              <Bath className="w-5 h-5 mx-auto text-amber-500 mb-1.5" />
              <p className="text-xl font-bold text-gray-900">
                <EditableField field="bathrooms" value={property.bathrooms} label="banheiros" type="number" />
              </p>
              <p className="text-[11px] text-gray-500 font-medium">Banheiros</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
              <Car className="w-5 h-5 mx-auto text-amber-500 mb-1.5" />
              <p className="text-xl font-bold text-gray-900">
                <EditableField field="parking" value={property.parking} label="vagas" type="number" />
              </p>
              <p className="text-[11px] text-gray-500 font-medium">Vagas</p>
            </div>
          </div>

          {/* Identificação e Localização */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <p className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-amber-500" /> Identificação
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Tipo</label>
                <select
                  value={property.type}
                  onChange={(e) => {
                    if (onUpdateProperty) {
                      updateProperty({ ...property, type: e.target.value as Property["type"] });
                      toast.success("Tipo atualizado!");
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {(["Apartamento", "Casa", "Comercial", "Terreno", "Lote", "Condomínio"] as const).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Empreendimento</label>
                <select
                  value={property.empreendimento || ""}
                  onChange={(e) => {
                    if (!onUpdateProperty) return;
                    const selected = e.target.value;
                    if (!selected) {
                      updateProperty({ ...property, empreendimento: undefined });
                      toast.success("Empreendimento removido");
                      return;
                    }
                    // Find a property with this empreendimento to pull shared data
                    const ref = allProperties.find(p => p.empreendimento === selected && p.id !== property.id);
                    if (ref) {
                      updateProperty({
                        ...property,
                        empreendimento: selected,
                        address: ref.address || property.address,
                        city: ref.city || property.city,
                        neighborhood: ref.neighborhood || property.neighborhood,
                        infraestrutura: ref.infraestrutura || property.infraestrutura,
                        posicaoPredio: property.posicaoPredio || ref.posicaoPredio,
                        posicaoSolar: property.posicaoSolar || ref.posicaoSolar,
                      });
                      toast.success(`Dados do empreendimento "${selected}" aplicados!`);
                    } else {
                      updateProperty({ ...property, empreendimento: selected });
                      toast.success("Empreendimento atualizado!");
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Selecione ou digite novo</option>
                  {[...new Set(allProperties.map(p => p.empreendimento).filter(Boolean))].sort().map(emp => (
                    <option key={emp} value={emp}>{emp}</option>
                  ))}
                </select>
                {/* Allow typing a new empreendimento */}
                {!allProperties.some(p => p.empreendimento === property.empreendimento) && property.empreendimento && (
                  <p className="text-[10px] text-amber-600 mt-1 font-medium">Novo: {property.empreendimento}</p>
                )}
                <input
                  type="text"
                  placeholder="Ou digite um novo..."
                  className="w-full mt-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && onUpdateProperty) {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) {
                        updateProperty({ ...property, empreendimento: val });
                        toast.success(`Empreendimento "${val}" definido!`);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Bairro</label>
                <EditableField field="neighborhood" value={property.neighborhood || ""} label="bairro" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Área Privativa</label>
                <EditableField field="privateArea" value={property.privateArea || 0} label="área privativa" type="number" />
                <span className="text-[10px] text-gray-400">m²</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Unidade/Apt</label>
                <EditableField field="unitNumber" value={property.unitNumber || ""} label="unidade" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Box</label>
                <EditableField field="boxNumber" value={property.boxNumber || ""} label="box" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Quadra</label>
                <EditableField field="quadra" value={property.quadra || ""} label="quadra" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Lote</label>
                <EditableField field="lote" value={property.lote || ""} label="lote" />
              </div>
            </div>
          </div>

          {/* Valor e Condições de Pagamento */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <p className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-amber-500" /> Valor e Condições de Pagamento
            </p>
            {/* Valores */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Valor do Imóvel</label>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-gray-500">R$</span>
                  <EditableField field="price" value={property.price} label="valor" type="number" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Valor Promocional</label>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-gray-500">R$</span>
                  <EditableField field="priceInstallment" value={property.priceInstallment || 0} label="valor promocional" type="number" />
                </div>
              </div>
            </div>

            {/* Corretagem */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
                <Percent className="w-3 h-3" /> Corretagem
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Comissão (%)</label>
                  <EditableField field="commission" value={property.commission || 0} label="comissão" type="number" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Valor Comissão</label>
                  <span className="text-sm font-semibold text-emerald-700">
                    R$ {formatCurrency(property.price * (property.commission || 0) / 100).replace("R$\u00a0", "")}
                  </span>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Bônus</label>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-gray-500">R$</span>
                    <EditableField field="bonus" value={property.bonus || 0} label="bônus" type="number" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Validade Bônus</label>
                  <EditableField field="bonusExpiry" value={property.bonusExpiry || ""} label="validade bônus" />
                </div>
              </div>
            </div>

            {/* Condições de Pagamento */}
            <div className="mt-4">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
                <CreditCard className="w-3 h-3" /> Condições de Pagamento
              </label>
              <div className="flex flex-wrap gap-2">
                {property.paymentConditions?.map((cond) => (
                  <button
                    key={cond}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-emerald-700 border border-emerald-200 shadow-sm hover:bg-emerald-50 transition-colors cursor-pointer"
                    onClick={() => onFilterByCondition?.(cond)}
                    title={`Ver imóveis com condição "${cond}"`}
                  >
                    {cond}
                  </button>
                ))}
                {property.paymentConditionsOther && (
                  <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-gray-600 border border-gray-200">
                    {property.paymentConditionsOther}
                  </span>
                )}
                {(!property.paymentConditions || property.paymentConditions.length === 0) && (
                  <span className="text-xs text-gray-400">Nenhuma condição cadastrada</span>
                )}
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-3">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Aceita Permuta</label>
                <button
                  onClick={() => {
                    if (onUpdateProperty) {
                      updateProperty({ ...property, acceptsExchange: !property.acceptsExchange });
                      toast.success(property.acceptsExchange ? "Permuta desativada" : "Permuta ativada");
                    }
                  }}
                  className={cn(
                    "w-10 h-6 rounded-full transition-colors relative",
                    property.acceptsExchange ? "bg-emerald-500" : "bg-gray-300"
                  )}
                >
                  <span className={cn("absolute w-4 h-4 rounded-full bg-white top-1 transition-all shadow-sm", property.acceptsExchange ? "left-5" : "left-1")} />
                </button>
              </div>
            </div>

            {/* Classificação de Negócio */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-500" /> Classificação de Negócio
              </label>
              <div className="flex flex-wrap gap-2">
                {(["Oferta", "Bom Negócio", "Normal", "Acima da Média"] as const).map((lbl) => {
                  const isSelected = property.dealLabel === lbl;
                  const styles: Record<string, string> = {
                    "Oferta": "text-emerald-700 bg-emerald-50 border-emerald-300 ring-emerald-400",
                    "Bom Negócio": "text-emerald-600 bg-emerald-50 border-emerald-200 ring-emerald-300",
                    "Normal": "text-amber-700 bg-amber-50 border-amber-300 ring-amber-400",
                    "Acima da Média": "text-red-600 bg-red-50 border-red-300 ring-red-400",
                  };
                  return (
                    <button
                      key={lbl}
                      onClick={() => {
                        const newLabel = isSelected ? null : lbl;
                        if (onUpdateProperty) {
                          updateProperty({ ...property, dealLabel: newLabel });
                        }
                        toast.success(newLabel ? `Classificado como "${newLabel}"` : "Classificação removida");
                      }}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all",
                        isSelected
                          ? styles[lbl] + " ring-2 ring-offset-1 shadow-sm"
                          : "text-gray-500 bg-white border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      {lbl === "Oferta" && "🏷️ "}{lbl === "Bom Negócio" && "🏷️ "}{lbl}
                    </button>
                  );
                })}
              </div>
              {property.dealLabel && (
                <p className="text-[11px] text-gray-500 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Classificação: <span className="font-bold text-gray-700">{property.dealLabel}</span>
                </p>
              )}
            </div>
          </div>

          {/* Identificação - Proprietário */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <p className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-500" /> Identificação
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  <User className="w-3 h-3 inline mr-1" />Proprietário
                </label>
                <select
                  value={property.owner || ""}
                  onChange={(e) => {
                    if (!onUpdateProperty) return;
                    const selectedOwner = e.target.value;
                    if (!selectedOwner) {
                      updateProperty({ ...property, owner: undefined, ownerPhone: undefined, ownerType: undefined });
                      return;
                    }
                    // Find existing property with this owner to pull their info
                    const ref = allProperties.find(p => p.owner === selectedOwner && p.id !== property.id);
                    if (ref) {
                      updateProperty({
                        ...property,
                        owner: selectedOwner,
                        ownerPhone: ref.ownerPhone || property.ownerPhone,
                        ownerType: ref.ownerType || property.ownerType,
                      });
                      toast.success(`Dados do proprietário "${selectedOwner}" aplicados!`);
                    } else {
                      updateProperty({ ...property, owner: selectedOwner });
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Selecione</option>
                  {[...new Set(allProperties.map(p => p.owner).filter(Boolean))].sort().map(owner => (
                    <option key={owner} value={owner}>{owner}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Ou digite um novo..."
                  className="w-full mt-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && onUpdateProperty) {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) {
                        updateProperty({ ...property, owner: val });
                        toast.success(`Proprietário "${val}" definido!`);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  <Phone className="w-3 h-3 inline mr-1" />Telefone
                </label>
                <EditableField field="ownerPhone" value={property.ownerPhone || ""} label="telefone" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Tipo Proprietário</label>
                <select
                  value={property.ownerType || ""}
                  onChange={(e) => {
                    if (onUpdateProperty) {
                      updateProperty({ ...property, ownerType: (e.target.value || undefined) as Property["ownerType"] });
                      toast.success("Tipo atualizado!");
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Selecione</option>
                  <option value="Particular">Particular</option>
                  <option value="Construtora">Construtora</option>
                  <option value="Investidor">Investidor</option>
                  <option value="Adm Comercial">Adm Comercial</option>
                  <option value="Exclusividade">Exclusividade</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  <Key className="w-3 h-3 inline mr-1" />Chaves do Imóvel
                </label>
                <EditableField field="keysLocation" value={property.keysLocation || ""} label="localização das chaves" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  <FileCheck className="w-3 h-3 inline mr-1" />Termo de Exclusividade
                </label>
                <EditableField field="exclusivityTerm" value={property.exclusivityTerm || ""} label="termo de exclusividade" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Corretor</label>
                <EditableField field="broker" value={property.broker} label="corretor" />
              </div>
            </div>
          </div>

          {/* Características do Imóvel */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <p className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-500" /> Características do Imóvel
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Condição / Mobília */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Condição / Mobília</label>
                <select
                  value={property.condicao || ""}
                  onChange={(e) => {
                    if (onUpdateProperty) {
                      const val = (e.target.value || undefined) as Property["condicao"];
                      updateProperty({ ...property, condicao: val, decorated: val === "Decorado" || val === "Mobiliado" });
                      toast.success("Condição atualizada!");
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Selecione</option>
                  <option value="Mobiliado">🛋️ Mobiliado</option>
                  <option value="Semi-mobiliado">🪑 Semi-mobiliado</option>
                  <option value="Vazio">📦 Vazio</option>
                  <option value="Decorado">🎨 Decorado</option>
                </select>
              </div>
              {/* Vista */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Vista</label>
                <select
                  value={property.vista || ""}
                  onChange={(e) => {
                    if (onUpdateProperty) {
                      const val = e.target.value || undefined;
                      updateProperty({ ...property, vista: val, seaView: val === "Mar" || val === "Mar / Lago" });
                      toast.success("Vista atualizada!");
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Selecione</option>
                  <option value="Mar">🌊 Mar</option>
                  <option value="Lago">💧 Lago</option>
                  <option value="Mar / Lago">🌊💧 Mar / Lago</option>
                  <option value="Cidade">🏙️ Cidade</option>
                  <option value="Parque">🌳 Parque</option>
                  <option value="Piscina">🏊 Piscina</option>
                  <option value="Rua">🛣️ Rua</option>
                  <option value="Interna">🏠 Interna</option>
                </select>
              </div>
              {/* Padrão */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Padrão</label>
                <select
                  value={property.padrao || ""}
                  onChange={(e) => {
                    if (onUpdateProperty) {
                      updateProperty({ ...property, padrao: (e.target.value || undefined) as Property["padrao"] });
                      toast.success("Padrão atualizado!");
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Selecione</option>
                  <option value="Econômico">Econômico</option>
                  <option value="Médio Padrão">Médio Padrão</option>
                  <option value="Alto Padrão">Alto Padrão</option>
                  <option value="Luxo">Luxo</option>
                </select>
              </div>
              {/* Posição no Prédio */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Posição no Prédio</label>
                <select
                  value={property.posicaoPredio || ""}
                  onChange={(e) => {
                    if (onUpdateProperty) {
                      updateProperty({ ...property, posicaoPredio: e.target.value || undefined });
                      toast.success("Posição atualizada!");
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Selecione</option>
                  <option value="Frente">Frente</option>
                  <option value="Fundos">Fundos</option>
                  <option value="Lateral Esquerda">Lateral Esquerda</option>
                  <option value="Lateral Direita">Lateral Direita</option>
                  <option value="Frente/Lateral">Frente/Lateral</option>
                  <option value="Fundos/Lateral">Fundos/Lateral</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              {/* Posição Solar */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Posição Solar</label>
                <select
                  value={property.posicaoSolar || ""}
                  onChange={(e) => {
                    if (onUpdateProperty) {
                      updateProperty({ ...property, posicaoSolar: e.target.value || undefined });
                      toast.success("Posição solar atualizada!");
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Selecione</option>
                  <option value="Nascente">Nascente (Sol da manhã)</option>
                  <option value="Poente">Poente (Sol da tarde)</option>
                  <option value="Norte">Norte</option>
                  <option value="Sul">Sul</option>
                  <option value="Nascente/Norte">Nascente/Norte</option>
                  <option value="Poente/Sul">Poente/Sul</option>
                </select>
              </div>
            </div>
            {/* Infraestrutura */}
            <div className="mt-4">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Infraestrutura</label>
              <div className="flex flex-wrap gap-2">
                {["Piscina", "Churrasqueira", "Salão de Festas", "Academia", "Sauna", "Espaço Gourmet", "Brinquedoteca", "Playground", "Quadra", "Portaria 24h", "Elevador", "Jardim"].map((item) => {
                  const isActive = property.infraestrutura?.includes(item);
                  return (
                    <button
                      key={item}
                      onClick={() => {
                        if (!onUpdateProperty) return;
                        const current = property.infraestrutura || [];
                        const updated = isActive
                          ? current.filter(i => i !== item)
                          : [...current, item];
                        updateProperty({ ...property, infraestrutura: updated });
                        toast.success(isActive ? `"${item}" removido` : `"${item}" adicionado`);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                        isActive
                          ? "bg-amber-50 text-amber-700 border-amber-300"
                          : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
              {property.infraestrutura?.includes("Elevador") && (
                <div className="flex items-center gap-2 mt-2">
                  <label className="text-[11px] font-bold text-gray-500 whitespace-nowrap">Qtd. Elevadores:</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={property.elevadores || 1}
                    onChange={(e) => {
                      if (!onUpdateProperty) return;
                      updateProperty({ ...property, elevadores: parseInt(e.target.value) || 1 });
                    }}
                    className="w-16 px-2 py-1 rounded border border-input text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              )}
            </div>
            {/* Outras Características */}
            <div className="mt-4">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Outras Características</label>
              <div className="flex flex-wrap gap-2">
                {["Beira Lago", "Beira Rio", "Beira Mar", "Terreno Seco", "Terreno Alagadiço", "Murado", "Cercado", "Esquina", "Frente p/ Rua", "Plano", "Aclive", "Declive", "Aterrado", "Escriturado", "Financiável"].map((item) => {
                  const isActive = property.outrasCaracteristicas?.includes(item);
                  return (
                    <button
                      key={item}
                      onClick={() => {
                        if (!onUpdateProperty) return;
                        const current = property.outrasCaracteristicas || [];
                        const updated = isActive
                          ? current.filter(i => i !== item)
                          : [...current, item];
                        updateProperty({ ...property, outrasCaracteristicas: updated });
                        toast.success(isActive ? `"${item}" removido` : `"${item}" adicionado`);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                        isActive
                          ? "bg-blue-50 text-blue-700 border-blue-300"
                          : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Video section */}
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <button onClick={() => setShowVideo(!showVideo)} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
              <span className="flex items-center gap-2 text-sm font-bold text-gray-800">
                <Play className="w-4 h-4 text-red-500" /> Vídeo do Imóvel
              </span>
              <ChevronRight className={cn("w-4 h-4 text-gray-400 transition-transform", showVideo && "rotate-90")} />
            </button>
            {showVideo && (
              <div className="aspect-video bg-black">
                <iframe src={videoUrl} title="Vídeo do imóvel" className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
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
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-colors shadow-sm">
                <MapPin className="w-4 h-4" /> Mapa
              </a>
              <a href={`https://wa.me/${broker?.whatsapp || "5511999999999"}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm">
                <Phone className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Outros imóveis do proprietário */}
        {ownerProperties.length > 0 && (
          <div className="border-t border-gray-100 p-5 sm:p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">Outros imóveis de {property.owner}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ownerProperties.map((sp) => (
                <SimilarCard key={sp.id} property={sp} onSelect={() => { setCurrentImageIndex(0); setShowVideo(false); onSelectSimilar?.(sp); }} />
              ))}
            </div>
          </div>
        )}
      </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-6 pb-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-muted text-muted-foreground text-sm font-bold shadow-lg hover:bg-muted/80 transition-all border border-border"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>
          {hasChanges && (
            <button
              onClick={handleConfirmUpdate}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500 text-white text-sm font-bold shadow-lg hover:bg-emerald-600 transition-all"
            >
              <Check className="w-4 h-4" /> Atualizar Imóvel
            </button>
          )}
        </div>
    </div>
  );
}

function SimilarCard({ property, onSelect }: { property: Property; onSelect: () => void }) {
  const [imgIndex, setImgIndex] = useState(0);
  const imgs = property.images && property.images.length > 0 ? property.images : [property.image];

  return (
    <button onClick={onSelect} className="rounded-xl overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors text-left border border-gray-100 group">
      <div className="relative h-28 overflow-hidden">
        <img src={imgs[imgIndex]} alt={property.title} className="w-full h-full object-cover" />
        {imgs.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setImgIndex((prev) => (prev > 0 ? prev - 1 : imgs.length - 1)); }}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setImgIndex((prev) => (prev < imgs.length - 1 ? prev + 1 : 0)); }}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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
