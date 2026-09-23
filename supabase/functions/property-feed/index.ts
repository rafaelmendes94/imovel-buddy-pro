// Public XML feed for real estate portals (VRSync + Imovelweb)
// URL: /functions/v1/property-feed?slug=<broker-slug>&format=vrsync|imovelweb
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function getServiceKey() {
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeys) {
    try {
      const parsed = JSON.parse(secretKeys);
      if (parsed?.default) return parsed.default as string;
    } catch {
      // Fallback below.
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
}

function toSlug(v: string) {
  return (v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function esc(s: unknown) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function xmlUpdatedAt(p: any) {
  const raw = p.updated_at || p.updatedAt || p.created_at || p.createdAt || Date.now();
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function cdata(s: unknown) {
  return `<![CDATA[${String(s ?? "").replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;
}

function norm(s: string) {
  return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function normalizePropertyType(tipo: string) {
  const t = norm(tipo);
  if (t.includes("apart") || t.includes("apto") || t.includes("cobert") || t.includes("studio") || t.includes("flat")) return "Apartamento";
  if ((t.includes("casa") || t.includes("sobrad")) && (t.includes("cond") || t.includes("horizontal"))) return "Casa em condominio";
  if ((t.includes("lote") || t.includes("terren")) && (t.includes("cond") || t.includes("fechado"))) return "Lote em condominio";
  if (t.includes("lote") || t.includes("terren")) return "Lote";
  if (t.includes("casa") || t.includes("sobrad")) return "Casa";
  return "Apartamento";
}

function firstText(...values: unknown[]) {
  return values.map((v) => String(v ?? "").trim()).find(Boolean) || "";
}

function linkedEntityValue(p: any, field: string) {
  return firstText(
    p.edificios?.[field],
    p.edificio?.[field],
    p.condominios?.[field],
    p.condominio?.[field],
    p.empreendimentos?.[field],
    p.empreendimento?.[field],
    p.loteamentos?.[field],
    p.loteamento?.[field],
  );
}

function propertyAddressField(p: any, field: string) {
  return firstText(p[field], linkedEntityValue(p, field));
}

function propertyStreet(p: any) {
  return firstText(p.endereco, p.logradouro, linkedEntityValue(p, "endereco"), linkedEntityValue(p, "logradouro"));
}

function propertyCode(p: any) {
  return firstText(p.codigo_interno, p.codigo, p.id);
}

function propertyStatus(p: any) {
  return firstText(p.status, p.status_imovel);
}

function propertyAreaTotal(p: any) {
  return Number(p.area || p.area_total || 0);
}

function propertyBedrooms(p: any) {
  return Number(p.quartos || p.dormitorios || 0);
}

function propertyLocation(p: any) {
  const tipo = normalizePropertyType(firstText(p.tipo, p.tipo_imovel, p.titulo));
  const parsed = parseQuadraLoteReference([p.unidade, p.complemento].filter(Boolean).join(" - "));
  const quadra = p.quadra || parsed.quadra || "";
  const unidadeAsLot = quadra && !p.lote ? cleanInternalReference(p.unidade) : "";
  const lote = p.lote || parsed.lote || (/^[A-Za-z0-9]{1,5}$/.test(unidadeAsLot) ? unidadeAsLot : "");
  const consumedComplemento = usesQuadraLote(tipo) && hasInternalLocationReference(p.complemento);
  const propertyNumber = firstText(p.numero);
  const inheritedAddressNumber = linkedEntityValue(p, "numero");
  return {
    tipo,
    unidade: tipo === "Apartamento" ? p.unidade || "" : "",
    numero: tipo === "Apartamento" ? propertyNumber || inheritedAddressNumber : tipo === "Casa" || tipo === "Lote em condominio" ? propertyNumber : "",
    quadra: usesQuadraLote(tipo) ? quadra : "",
    lote: usesQuadraLote(tipo) ? lote : "",
    complemento: consumedComplemento ? "" : p.complemento || "",
  };
}

function usesQuadraLote(tipo: string) {
  return tipo === "Casa em condominio" || tipo === "Lote" || tipo === "Lote em condominio";
}

function cleanInternalReference(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/^(?:ap(?:to|artamento)?\s*\/\s*)?(?:ap(?:to|artamento)?|unid(?:ade)?|un)\s*[/.:\-–]?\s*/i, "")
    .replace(/^n?[ºo°]\s*/i, "")
    .trim();
}

function hasInternalLocationReference(value: unknown) {
  const v = norm(String(value ?? ""));
  return /\b(qd|quadra|lt|lote|apto|apartamento|unidade|un)\b/.test(v);
}

function parseQuadraLoteReference(value: string) {
  const text = norm(value);
  const result = { quadra: "", lote: "" };
  const quadraMatch = text.match(/\b(?:q(?:uadra)?|qd)\s*[.:/-]?\s*([a-z0-9]{1,5})\b/);
  const loteMatch = text.match(/\b(?:l(?:ote)?|lt)\s*[.:/-]?\s*([a-z0-9]{1,5})\b/);
  const unidadeMatch =
    text.match(/\b(?:unid(?:ade)?|un)\s*[/.:\-–]?\s*([a-z0-9]{1,5})\b/) ||
    text.match(/\bap(?:to|artamento)?(?:\s*\/\s*(?:unid(?:ade)?|un))?\s*[/.:\-–]?\s*([a-z0-9]{1,5})\b/);
  const compactMatch = text.match(/\b([a-z]{1,3}|\d{1,3})\s*[-/]\s*(\d{1,5}[a-z]?)\b/);
  if (quadraMatch) result.quadra = quadraMatch[1].toUpperCase();
  if (loteMatch) result.lote = loteMatch[1].toUpperCase();
  if (!result.quadra && compactMatch) result.quadra = compactMatch[1].toUpperCase();
  if (!result.lote && compactMatch) result.lote = compactMatch[2].toUpperCase();
  if (!result.lote && result.quadra && unidadeMatch) result.lote = unidadeMatch[1].toUpperCase();
  return result;
}

// Map internal "tipo" → VRSync PropertyType / PropertySubType
function vrsyncType(tipo: string): { type: string; sub: string } {
  const normalized = normalizePropertyType(tipo);
  if (normalized === "Apartamento")
    return { type: "Residential", sub: "Apartment" };
  if (normalized === "Casa" || normalized === "Casa em condominio") return { type: "Residential", sub: "Home" };
  if (normalized === "Lote" || normalized === "Lote em condominio") return { type: "Residential", sub: "ResidentialAllotmentLand" };
  return { type: "Residential", sub: "Apartment" };
}

// Map internal "tipo" → Imovelweb TipoImovel
function imovelwebType(tipo: string): string {
  const normalized = normalizePropertyType(tipo);
  if (normalized === "Apartamento") return "Apartamento";
  if (normalized === "Casa" || normalized === "Casa em condominio") return "Casa";
  if (normalized === "Lote" || normalized === "Lote em condominio") return "Terreno";
  return "Apartamento";
}

function normalizePhone(p: string) {
  const digits = String(p ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
}

function buildVrsync(properties: any[], contact: { name: string; email: string; phone: string }) {
  const items = properties.map((p) => {
    const loc = propertyLocation(p);
    const { type, sub } = vrsyncType(loc.tipo);
    const images = Array.isArray(p.imagens) ? p.imagens.filter(Boolean) : [];
    const media = images
      .map(
        (url: string, i: number) =>
          `<Item medium="image" caption="Foto ${i + 1}" primary="${i === 0 ? "true" : "false"}">${esc(url)}</Item>`,
      )
      .join("");
    const features = [
      ...(Array.isArray(p.infraestrutura) ? p.infraestrutura : []),
      ...(Array.isArray(p.outras_caracteristicas) ? p.outras_caracteristicas : []),
    ]
      .filter(Boolean)
      .map((f: string) => `<Feature>${esc(f)}</Feature>`)
      .join("");
    return `
    <Listing>
      <ListID>${esc(propertyCode(p))}</ListID>
      <updatedAt>${esc(xmlUpdatedAt(p))}</updatedAt>
      <Title>${esc(p.titulo)}</Title>
      <TransactionType>For Sale</TransactionType>
      <ListPrice currency="BRL">${Number(p.preco || 0)}</ListPrice>
      <PropertyType>${type}</PropertyType>
      <PropertySubType>${sub}</PropertySubType>
      <TipoImovel>${esc(loc.tipo)}</TipoImovel>
      <Unidade>${esc(loc.unidade)}</Unidade>
      <Quadra>${esc(loc.quadra)}</Quadra>
      <Lote>${esc(loc.lote)}</Lote>
      <Numero>${esc(loc.numero)}</Numero>
      <Details>
        <LivingArea unit="square metres">${Number(p.area_privativa || propertyAreaTotal(p) || 0)}</LivingArea>
        <LotArea unit="square metres">${propertyAreaTotal(p)}</LotArea>
        <Bedrooms>${propertyBedrooms(p)}</Bedrooms>
        <Bathrooms>${Number(p.banheiros || 0)}</Bathrooms>
        <Garage type="Parking Space">${Number(p.vagas || 0)}</Garage>
        <Description>${cdata(p.descricao || p.titulo)}</Description>
        <Features>${features}</Features>
      </Details>
      <Location displayAddress="Neighborhood">
        <Country>BR</Country>
        <State>${esc(propertyAddressField(p, "estado"))}</State>
        <City>${esc(propertyAddressField(p, "cidade"))}</City>
        <Neighborhood>${esc(propertyAddressField(p, "bairro"))}</Neighborhood>
        <Address>${esc([propertyStreet(p), loc.numero].filter(Boolean).join(", "))}</Address>
        <PostalCode>${esc(propertyAddressField(p, "cep"))}</PostalCode>
        <Latitude>${Number(p.latitude || 0)}</Latitude>
        <Longitude>${Number(p.longitude || 0)}</Longitude>
      </Location>
      <Media>${media}</Media>
      <ContactInfo>
        <Name>${esc(contact.name)}</Name>
        <Telephone>${esc(contact.phone)}</Telephone>
        <Email>${esc(contact.email)}</Email>
      </ContactInfo>
    </Listing>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<Carga xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Imoveis>${items.join("")}
  </Imoveis>
</Carga>`;
}

function buildImovelweb(properties: any[], contact: { name: string; email: string; phone: string }) {
  const items = properties.map((p) => {
    const loc = propertyLocation(p);
    const images = Array.isArray(p.imagens) ? p.imagens.filter(Boolean) : [];
    const fotos = images
      .map((url: string, i: number) => {
        const name = (url.split("/").pop() || `foto-${i + 1}.jpg`).split("?")[0];
        return `<Foto><URLArquivo>${esc(url)}</URLArquivo><NomeArquivo>${esc(name)}</NomeArquivo><Principal>${i === 0 ? 1 : 0}</Principal></Foto>`;
      })
      .join("");
    return `
    <Imovel>
      <CodigoImovel>${esc(propertyCode(p))}</CodigoImovel>
      <updatedAt>${esc(xmlUpdatedAt(p))}</updatedAt>
      <TipoImovel>${esc(imovelwebType(loc.tipo))}</TipoImovel>
      <TipoPadraoMV>${esc(loc.tipo)}</TipoPadraoMV>
      <SubTipoImovel>${esc(p.padrao || "Padrão")}</SubTipoImovel>
      <TituloImovel>${esc(p.titulo)}</TituloImovel>
      <Observacao>${cdata(p.descricao || "")}</Observacao>
      <Modelo>Venda</Modelo>
      <Cidade>${esc(propertyAddressField(p, "cidade"))}</Cidade>
      <UF>${esc(propertyAddressField(p, "estado"))}</UF>
      <Bairro>${esc(propertyAddressField(p, "bairro"))}</Bairro>
      <CEP>${esc(propertyAddressField(p, "cep"))}</CEP>
      <Endereco>${esc(propertyStreet(p))}</Endereco>
      <Numero>${esc(loc.numero)}</Numero>
      <Unidade>${esc(loc.unidade)}</Unidade>
      <Quadra>${esc(loc.quadra)}</Quadra>
      <Lote>${esc(loc.lote)}</Lote>
      <Complemento>${esc(loc.complemento)}</Complemento>
      <Latitude>${Number(p.latitude || 0)}</Latitude>
      <Longitude>${Number(p.longitude || 0)}</Longitude>
      <PrecoVenda>${Number(p.preco || 0)}</PrecoVenda>
      <AreaUtil>${Number(p.area_privativa || propertyAreaTotal(p) || 0)}</AreaUtil>
      <AreaTotal>${propertyAreaTotal(p)}</AreaTotal>
      <QtdDormitorios>${propertyBedrooms(p)}</QtdDormitorios>
      <QtdSuites>0</QtdSuites>
      <QtdBanheiros>${Number(p.banheiros || 0)}</QtdBanheiros>
      <QtdVagas>${Number(p.vagas || 0)}</QtdVagas>
      <Fotos>${fotos}</Fotos>
      <NomeContato>${esc(contact.name)}</NomeContato>
      <EmailContato>${esc(contact.email)}</EmailContato>
      <TelefoneContato>${esc(contact.phone)}</TelefoneContato>
      <DataAtualizacao>${new Date(p.updated_at || Date.now()).toISOString()}</DataAtualizacao>
    </Imovel>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<Carga>
  <Imoveis>${items.join("")}
  </Imoveis>
</Carga>`;
}

async function loadLinkedEntities(supabase: any, table: string, ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (!uniqueIds.length) return new Map<string, any>();

  const { data, error } = await supabase
    .from(table)
    .select("id, numero, logradouro")
    .in("id", uniqueIds);

  if (error) {
    console.error(`property-feed ${table} query error`, error);
    return new Map<string, any>();
  }

  return new Map((data || []).map((item: any) => [item.id, item]));
}

async function enrichPropertiesWithLinkedAddresses(supabase: any, properties: any[]) {
  const [edificios, condominios, empreendimentos, loteamentos] = await Promise.all([
    loadLinkedEntities(supabase, "edificios", properties.map((p) => p.edificio_id)),
    loadLinkedEntities(supabase, "condominios", properties.map((p) => p.condominio_id)),
    loadLinkedEntities(supabase, "empreendimentos", properties.map((p) => p.empreendimento_id)),
    loadLinkedEntities(supabase, "loteamentos", properties.map((p) => p.loteamento_id)),
  ]);

  return properties.map((p) => ({
    ...p,
    edificios: p.edificio_id ? edificios.get(p.edificio_id) : undefined,
    condominios: p.condominio_id ? condominios.get(p.condominio_id) : undefined,
    empreendimentos: p.empreendimento_id ? empreendimentos.get(p.empreendimento_id) : undefined,
    loteamentos: p.loteamento_id ? loteamentos.get(p.loteamento_id) : undefined,
  }));
}

export async function handler(req: Request) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const url = new URL(req.url);
    const slugParam = (url.searchParams.get("slug") || "").trim().toLowerCase();
    const format = (url.searchParams.get("format") || "vrsync").toLowerCase();

    if (!slugParam) {
      return new Response("Missing slug", { status: 400, headers: CORS });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      getServiceKey(),
    );

    // Resolve slug → profile (broker or agency owner)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, phone")
      .not("full_name", "is", null)
      .range(0, 9999);
    if (profilesError) {
      console.error("property-feed profiles query error", profilesError);
      return new Response("Profiles query error", { status: 500, headers: CORS });
    }

    const match = (profiles || []).find((p: any) => p.full_name && toSlug(p.full_name) === slugParam);
    if (!match) {
      return new Response("Broker not found", { status: 404, headers: CORS });
    }

    // Collect user_ids: the owner + any brokers under this agency
    const ids = new Set<string>([match.id]);

    // Check active subscription via RPC
    const { data: hasSub } = await supabase.rpc("imovel_owner_has_active_sub", { _owner: match.id });

    let properties: any[] = [];
    if (hasSub) {
      const { data } = await supabase
        .from("imoveis")
        .select("*")
        .in("corretor_id", Array.from(ids))
        .eq("ativo_site", true)
        .eq("publicar_xml", true)
        .neq("status_imovel", "Vendido");
      properties = data || [];
      properties = await enrichPropertiesWithLinkedAddresses(supabase, properties);
    }

    const contact = {
      name: match.full_name || "",
      email: "",
      phone: normalizePhone(match.phone || ""),
    };

    const xml = format === "imovelweb"
      ? buildImovelweb(properties, contact)
      : buildVrsync(properties, contact);

    const lastUpdated = properties.reduce(
      (acc, p) => Math.max(acc, new Date(p.updated_at || 0).getTime()),
      0,
    );

    return new Response(xml, {
      status: 200,
      headers: {
        ...CORS,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=900",
        "Last-Modified": new Date(lastUpdated || Date.now()).toUTCString(),
      },
    });
  } catch (e) {
    console.error("property-feed error", e);
    return new Response(`Error: ${(e as Error).message}`, { status: 500, headers: CORS });
  }
}

if (import.meta.main) {
  Deno.serve(handler);
}
