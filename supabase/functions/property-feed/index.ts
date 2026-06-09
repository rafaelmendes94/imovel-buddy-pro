// Public XML feed for real estate portals (VRSync + Imovelweb)
// URL: /functions/v1/property-feed?slug=<broker-slug>&format=vrsync|imovelweb
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

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

function cdata(s: unknown) {
  return `<![CDATA[${String(s ?? "").replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;
}

// Map internal "tipo" → VRSync PropertyType / PropertySubType
function vrsyncType(tipo: string): { type: string; sub: string } {
  const t = (tipo || "").toLowerCase();
  if (t.includes("apart") || t.includes("cobert") || t.includes("flat") || t.includes("studio") || t.includes("kit"))
    return { type: "Residential", sub: "Apartment" };
  if (t.includes("casa") && t.includes("cond")) return { type: "Residential", sub: "Home" };
  if (t.includes("casa") || t.includes("sobrad")) return { type: "Residential", sub: "Home" };
  if (t.includes("terren") || t.includes("lote")) return { type: "Residential", sub: "ResidentialAllotmentLand" };
  if (t.includes("sala") || t.includes("comerc") || t.includes("loja")) return { type: "Commercial", sub: "CommercialBuilding" };
  if (t.includes("galp") || t.includes("indust")) return { type: "Commercial", sub: "Industrial" };
  if (t.includes("rural") || t.includes("fazend") || t.includes("chac") || t.includes("sit"))
    return { type: "Residential", sub: "Farm" };
  return { type: "Residential", sub: "Apartment" };
}

// Map internal "tipo" → Imovelweb TipoImovel
function imovelwebType(tipo: string): string {
  const t = (tipo || "").toLowerCase();
  if (t.includes("apart")) return "Apartamento";
  if (t.includes("cobert")) return "Cobertura";
  if (t.includes("casa")) return "Casa";
  if (t.includes("sobrad")) return "Sobrado";
  if (t.includes("terren") || t.includes("lote")) return "Terreno";
  if (t.includes("sala")) return "Sala Comercial";
  if (t.includes("loja")) return "Loja";
  if (t.includes("galp")) return "Galpão";
  if (t.includes("rural") || t.includes("fazend")) return "Fazenda";
  if (t.includes("chac")) return "Chácara";
  if (t.includes("sit")) return "Sítio";
  if (t.includes("flat")) return "Flat";
  if (t.includes("studio") || t.includes("kit")) return "Studio";
  return "Outros";
}

function normalizePhone(p: string) {
  const digits = String(p ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
}

function buildVrsync(properties: any[], contact: { name: string; email: string; phone: string }) {
  const items = properties.map((p) => {
    const { type, sub } = vrsyncType(p.tipo);
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
      <ListID>${esc(p.id)}</ListID>
      <Title>${esc(p.titulo)}</Title>
      <TransactionType>For Sale</TransactionType>
      <ListPrice currency="BRL">${Number(p.preco || 0)}</ListPrice>
      <PropertyType>${type}</PropertyType>
      <PropertySubType>${sub}</PropertySubType>
      <Details>
        <LivingArea unit="square metres">${Number(p.area_privativa || p.area || 0)}</LivingArea>
        <LotArea unit="square metres">${Number(p.area || 0)}</LotArea>
        <Bedrooms>${Number(p.quartos || 0)}</Bedrooms>
        <Bathrooms>${Number(p.banheiros || 0)}</Bathrooms>
        <Garage type="Parking Space">${Number(p.vagas || 0)}</Garage>
        <Description>${cdata(p.descricao || p.titulo)}</Description>
        <Features>${features}</Features>
      </Details>
      <Location displayAddress="Neighborhood">
        <Country>BR</Country>
        <State>${esc(p.estado)}</State>
        <City>${esc(p.cidade)}</City>
        <Neighborhood>${esc(p.bairro)}</Neighborhood>
        <Address>${esc([p.endereco, p.numero].filter(Boolean).join(", "))}</Address>
        <PostalCode>${esc(p.cep)}</PostalCode>
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
    const images = Array.isArray(p.imagens) ? p.imagens.filter(Boolean) : [];
    const fotos = images
      .map((url: string, i: number) => {
        const name = (url.split("/").pop() || `foto-${i + 1}.jpg`).split("?")[0];
        return `<Foto><URLArquivo>${esc(url)}</URLArquivo><NomeArquivo>${esc(name)}</NomeArquivo><Principal>${i === 0 ? 1 : 0}</Principal></Foto>`;
      })
      .join("");
    return `
    <Imovel>
      <CodigoImovel>${esc(p.id)}</CodigoImovel>
      <TipoImovel>${esc(imovelwebType(p.tipo))}</TipoImovel>
      <SubTipoImovel>${esc(p.padrao || "Padrão")}</SubTipoImovel>
      <TituloImovel>${esc(p.titulo)}</TituloImovel>
      <Observacao>${cdata(p.descricao || "")}</Observacao>
      <Modelo>Venda</Modelo>
      <Cidade>${esc(p.cidade)}</Cidade>
      <UF>${esc(p.estado)}</UF>
      <Bairro>${esc(p.bairro)}</Bairro>
      <CEP>${esc(p.cep)}</CEP>
      <Endereco>${esc(p.endereco)}</Endereco>
      <Numero>${esc(p.numero)}</Numero>
      <Complemento>${esc(p.complemento)}</Complemento>
      <Latitude>${Number(p.latitude || 0)}</Latitude>
      <Longitude>${Number(p.longitude || 0)}</Longitude>
      <PrecoVenda>${Number(p.preco || 0)}</PrecoVenda>
      <AreaUtil>${Number(p.area_privativa || p.area || 0)}</AreaUtil>
      <AreaTotal>${Number(p.area || 0)}</AreaTotal>
      <QtdDormitorios>${Number(p.quartos || 0)}</QtdDormitorios>
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

Deno.serve(async (req) => {
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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Resolve slug → profile (broker or agency owner)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, account_type");

    const match = (profiles || []).find((p: any) => p.full_name && toSlug(p.full_name) === slugParam);
    if (!match) {
      return new Response("Broker not found", { status: 404, headers: CORS });
    }

    // Collect user_ids: the owner + any brokers under this agency
    const ids = new Set<string>([match.user_id]);
    const { data: agencyBrokers } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("agency_id", match.user_id);
    (agencyBrokers || []).forEach((b: any) => ids.add(b.user_id));

    // Check active subscription via RPC
    const { data: hasSub } = await supabase.rpc("imovel_owner_has_active_sub", { _owner: match.user_id });

    let properties: any[] = [];
    if (hasSub) {
      const { data } = await supabase
        .from("imoveis")
        .select("*")
        .in("user_id", Array.from(ids))
        .eq("ativo_site", true)
        .eq("publicar_xml", true)
        .neq("status", "Vendido");
      properties = data || [];
    }

    const contact = {
      name: match.full_name || "",
      email: match.email || "",
      phone: normalizePhone(properties[0]?.proprietario_telefone || ""),
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
});
