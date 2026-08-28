import { Property } from "@/data/mockData";
import { generatePhotoBookPdf } from "@/utils/generatePhotoBookPdf";

export async function generatePropertyPdf(property: Property) {
  const images = Array.from(
    new Set([property.image, ...(property.images || [])].filter(Boolean) as string[])
  );

  await generatePhotoBookPdf({
    title: property.title,
    code: property.code,
    price: property.price,
    priceInstallment: property.priceInstallment,
    address: property.address,
    neighborhood: property.neighborhood,
    city: property.city,
    status: property.status,
    type: property.type,
    empreendimento: property.empreendimento,
    unit: property.unitNumber,
    quadra: property.quadra,
    lote: property.lote,
    box: property.boxNumber,
    area: property.area,
    privateArea: property.privateArea,
    bedrooms: property.bedrooms,
    suites: (property as any).suites,
    bathrooms: property.bathrooms,
    parking: property.parking,
    description: property.description,
    features: [
      ...(property.infraestrutura || []),
      ...(property.outrasCaracteristicas || []),
      property.vista ? `Vista: ${property.vista}` : "",
      property.condicao ? `Condição: ${property.condicao}` : "",
      property.padrao ? `Padrão: ${property.padrao}` : "",
      property.seaView ? "Vista para o mar" : "",
      property.decorated ? "Decorado" : "",
      property.acceptsExchange ? "Aceita permuta" : "",
    ].filter(Boolean) as string[],
    brokerName: property.broker,
    images,
    pageUrl: typeof window !== "undefined" ? `${window.location.origin}/imovel/${property.id}` : null,
  });
}
