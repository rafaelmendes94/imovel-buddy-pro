interface CatalogProperty {
  id: string;
  titulo: string;
  endereco: string;
  cidade: string;
  bairro?: string | null;
  tipo: string;
  status: string;
  preco: number;
  area: number;
  quartos: number;
  banheiros: number;
  vagas: number;
  imagens: string[] | null;
  vista_mar?: boolean;
  decorado?: boolean;
  aceita_permuta?: boolean;
  condicoes_pagamento?: string[] | null;
  empreendimento?: string | null;
  unidade?: string | null;
}

interface CatalogParams {
  brokerName: string;
  creci?: string;
  whatsapp?: string;
  email?: string;
  avatarUrl?: string | null;
  properties: CatalogProperty[];
  soldProperties: CatalogProperty[];
  accentColor?: string | null;
  fileSlug: string;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

async function imageToBase64(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateBrokerCatalogPdf(params: CatalogParams) {
  const mod: any = await import("html2pdf.js/dist/html2pdf.bundle.min.js").catch(() => import("html2pdf.js"));
  const html2pdf = mod.default || mod;
  const { brokerName, creci, whatsapp, email, avatarUrl, properties, soldProperties, accentColor, fileSlug } = params;

  const accent = accentColor && accentColor.trim() ? accentColor : "#1e3a5f";
  const accentDark = accentColor && accentColor.trim() ? accentColor : "#0f2747";

  const all = [...properties, ...soldProperties];
  const totalVgv = all.reduce((s, p) => s + Number(p.preco || 0), 0);
  const soldVgv = soldProperties.reduce((s, p) => s + Number(p.preco || 0), 0);

  // Pre-fetch images
  const avatarB64 = avatarUrl ? await imageToBase64(avatarUrl) : null;
  const imgs = await Promise.all(all.map((p) => (p.imagens?.[0] ? imageToBase64(p.imagens[0]) : Promise.resolve(null))));

  const statusBg = (status: string) =>
    status === "Vendido" ? "#dc2626" : status === "Reservado" ? "#f59e0b" : "#16a34a";

  const renderCard = (p: CatalogProperty, img: string | null) => `
    <div style="page-break-inside:avoid;break-inside:avoid;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.06);margin-bottom:12px;">
      <div style="position:relative;width:100%;aspect-ratio:4/3;background:#f3f4f6;overflow:hidden;">
        ${img ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover;display:block;" />` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:11px;">Sem foto</div>`}
        <span style="position:absolute;top:8px;left:8px;background:${statusBg(p.status)};color:#fff;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;padding:4px 8px;border-radius:999px;">${p.status}</span>
        <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top, rgba(0,0,0,0.75), transparent);padding:10px;">
          <p style="margin:0;color:#fff;font-size:18px;font-weight:900;text-shadow:0 1px 3px rgba(0,0,0,0.4);">${formatCurrency(Number(p.preco))}</p>
        </div>
      </div>
      <div style="padding:10px 12px;">
        <h3 style="margin:0 0 4px;font-size:12px;font-weight:800;color:#111827;line-height:1.25;">${p.titulo}</h3>
        <p style="margin:0 0 6px;font-size:9.5px;color:#6b7280;">📍 ${[p.bairro, p.cidade].filter(Boolean).join(" · ")}</p>
        ${(p.area > 0 || p.quartos > 0 || p.banheiros > 0 || p.vagas > 0) ? `
        <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:9px;color:#374151;border-top:1px solid #f3f4f6;padding-top:6px;margin-top:4px;">
          ${p.area > 0 ? `<span>📐 ${p.area}m²</span>` : ""}
          ${p.quartos > 0 ? `<span>🛏 ${p.quartos}</span>` : ""}
          ${p.banheiros > 0 ? `<span>🛁 ${p.banheiros}</span>` : ""}
          ${p.vagas > 0 ? `<span>🚗 ${p.vagas}</span>` : ""}
        </div>` : ""}
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;">
          ${p.vista_mar ? `<span style="background:${accent}1a;color:${accent};font-size:8px;font-weight:700;padding:2px 6px;border-radius:999px;">Vista mar</span>` : ""}
          ${p.decorado ? `<span style="background:#fef3c7;color:#92400e;font-size:8px;font-weight:700;padding:2px 6px;border-radius:999px;">Decorado</span>` : ""}
          ${p.aceita_permuta ? `<span style="background:#dcfce7;color:#166534;font-size:8px;font-weight:700;padding:2px 6px;border-radius:999px;">Permuta</span>` : ""}
          ${(p.condicoes_pagamento || []).slice(0, 2).map(c => `<span style="background:#dbeafe;color:#1e40af;font-size:8px;font-weight:700;padding:2px 6px;border-radius:999px;">${c}</span>`).join("")}
        </div>
        <p style="margin:6px 0 0;font-size:8px;color:#9ca3af;font-family:monospace;">${p.id.slice(0, 8).toUpperCase()}</p>
      </div>
    </div>
  `;

  // Build pages with 4 properties each (2x2 grid)
  const PER_PAGE = 4;
  const pageBlocks: string[] = [];
  for (let i = 0; i < all.length; i += PER_PAGE) {
    const slice = all.slice(i, i + PER_PAGE);
    const sliceImgs = imgs.slice(i, i + PER_PAGE);
    const pageCards = slice.map((p, idx) => renderCard(p, sliceImgs[idx])).join("");
    pageBlocks.push(`
      <div style="page-break-after:always;padding:14px 14px 10px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:10px;height:272mm;">
          ${pageCards}
        </div>
      </div>
    `);
  }
  const cardsHtml = pageBlocks.join("");

  const html = `
<div style="font-family:-apple-system,'Segoe UI',Arial,sans-serif;color:#111827;">

  <!-- COVER -->
  <div style="page-break-after:always;background:linear-gradient(135deg, ${accentDark}, ${accent});color:#fff;padding:60px 40px;min-height:260mm;display:flex;flex-direction:column;justify-content:space-between;">
    <div>
      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;opacity:0.85;">Catálogo de Imóveis</p>
      <div style="height:3px;width:60px;background:#fff;margin:12px 0 30px;border-radius:2px;"></div>
    </div>

    <div style="text-align:center;">
      ${avatarB64 ? `<img src="${avatarB64}" style="width:140px;height:140px;border-radius:50%;border:5px solid rgba(255,255,255,0.3);object-fit:cover;margin:0 auto 20px;display:block;" />` : ""}
      <h1 style="margin:0 0 8px;font-size:38px;font-weight:900;letter-spacing:-0.02em;line-height:1.1;">${brokerName}</h1>
      ${creci ? `<p style="margin:0 0 18px;font-size:13px;opacity:0.9;font-weight:600;">CRECI ${creci}</p>` : ""}
      <div style="display:inline-flex;gap:14px;flex-wrap:wrap;justify-content:center;font-size:11px;opacity:0.95;">
        ${whatsapp ? `<span style="background:rgba(255,255,255,0.15);padding:6px 14px;border-radius:999px;">📱 ${whatsapp}</span>` : ""}
        ${email ? `<span style="background:rgba(255,255,255,0.15);padding:6px 14px;border-radius:999px;">✉ ${email}</span>` : ""}
      </div>
    </div>

    <div style="display:flex;gap:12px;justify-content:space-between;text-align:center;border-top:1px solid rgba(255,255,255,0.2);padding-top:24px;">
      <div style="flex:1;">
        <p style="margin:0;font-size:28px;font-weight:900;">${all.length}</p>
        <p style="margin:4px 0 0;font-size:9px;text-transform:uppercase;letter-spacing:0.15em;opacity:0.8;">Imóveis</p>
      </div>
      <div style="flex:1;">
        <p style="margin:0;font-size:28px;font-weight:900;">${formatCurrency(totalVgv)}</p>
        <p style="margin:4px 0 0;font-size:9px;text-transform:uppercase;letter-spacing:0.15em;opacity:0.8;">VGV em carteira</p>
      </div>
      <div style="flex:1;">
        <p style="margin:0;font-size:28px;font-weight:900;">${formatCurrency(soldVgv)}</p>
        <p style="margin:4px 0 0;font-size:9px;text-transform:uppercase;letter-spacing:0.15em;opacity:0.8;">VGV vendido</p>
      </div>
    </div>
  </div>

  <!-- PROPERTIES GRID -->
  <div style="padding:20px 16px;">
    <div style="margin-bottom:16px;border-left:4px solid ${accent};padding-left:12px;">
      <p style="margin:0;font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.2em;font-weight:700;">Portfólio completo</p>
      <h2 style="margin:4px 0 0;font-size:20px;font-weight:900;color:#111827;">${all.length} imóve${all.length === 1 ? "l" : "is"}</h2>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      ${cardsHtml}
    </div>
    <p style="margin-top:24px;text-align:center;font-size:9px;color:#9ca3af;">
      ${brokerName} · Gerado em ${new Date().toLocaleDateString("pt-BR")}
    </p>
  </div>
</div>
`;

  const container = document.createElement("div");
  container.style.width = "210mm";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    await html2pdf()
      .set({
        margin: [8, 0, 8, 0],
        filename: `catalogo-${fileSlug}.pdf`,
        image: { type: "jpeg", quality: 0.9 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      })
      .from(container)
      .save();
  } finally {
    document.body.removeChild(container);
  }
}
