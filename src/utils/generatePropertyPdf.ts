import { Property, formatCurrency } from "@/data/mockData";

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

function row(label: string, value: string | number | undefined | null) {
  if (value === undefined || value === null || value === "") return "";
  return `<tr><td style="padding:6px 12px;font-weight:600;color:#374151;border-bottom:1px solid #f3f4f6;width:40%;font-size:11px;">${label}</td><td style="padding:6px 12px;color:#1f2937;border-bottom:1px solid #f3f4f6;font-size:11px;">${value}</td></tr>`;
}

function sectionTitle(title: string) {
  return `<div style="background:#1e3a5f;color:#fff;padding:8px 16px;font-size:13px;font-weight:700;margin-top:18px;border-radius:4px;">${title}</div>`;
}

export async function generatePropertyPdf(property: Property) {
  const html2pdf = (await import("html2pdf.js")).default;

  // Convert main image + gallery to base64
  const mainImgB64 = property.image ? await imageToBase64(property.image) : null;
  const galleryPromises = (property.images || []).slice(0, 12).map((img) => imageToBase64(img));
  const galleryB64 = await Promise.all(galleryPromises);

  const statusColors: Record<string, string> = {
    "Disponível": "#16a34a",
    "Vendido": "#dc2626",
    "Reservado": "#f59e0b",
    "Alugado": "#2563eb",
    "Suspenso": "#6b7280",
  };
  const statusColor = statusColors[property.status] || "#6b7280";

  // Build HTML
  let html = `
<div style="font-family:'Segoe UI',Arial,sans-serif;color:#1f2937;max-width:100%;">
  <!-- Header -->
  <div style="position:relative;border-radius:8px;overflow:hidden;margin-bottom:16px;">
    ${mainImgB64 ? `<img src="${mainImgB64}" style="width:100%;height:260px;object-fit:cover;display:block;" />` : `<div style="width:100%;height:260px;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:14px;color:#9ca3af;">Sem foto</div>`}
    <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.75));padding:20px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="background:${statusColor};color:#fff;padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;">${property.status}</span>
        ${property.code ? `<span style="background:rgba(255,255,255,0.2);color:#fff;padding:3px 10px;border-radius:12px;font-size:10px;">Cód: ${property.code}</span>` : ""}
        ${property.dealLabel ? `<span style="background:#f59e0b;color:#fff;padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;">${property.dealLabel}</span>` : ""}
      </div>
      <h1 style="color:#fff;font-size:20px;font-weight:800;margin:0;">${property.title}</h1>
      <p style="color:#e5e7eb;font-size:12px;margin:4px 0 0;">${property.address}${property.neighborhood ? `, ${property.neighborhood}` : ""} — ${property.city}</p>
    </div>
  </div>

  <!-- Price Banner -->
  <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);color:#fff;padding:16px 20px;border-radius:8px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
    <div>
      <div style="font-size:10px;opacity:0.8;text-transform:uppercase;letter-spacing:1px;">Valor de Venda</div>
      <div style="font-size:26px;font-weight:800;">${formatCurrency(property.price)}</div>
    </div>
    ${property.priceInstallment ? `<div style="text-align:right;"><div style="font-size:10px;opacity:0.8;">Parcelas a partir de</div><div style="font-size:18px;font-weight:700;">${formatCurrency(property.priceInstallment)}/mês</div></div>` : ""}
  </div>

  <!-- Quick Stats -->
  <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
    ${[
      { label: "Tipo", val: property.type },
      { label: "Área", val: `${property.area} m²` },
      { label: "Quartos", val: property.bedrooms },
      { label: "Banheiros", val: property.bathrooms },
      { label: "Vagas", val: property.parking },
    ]
      .filter((s) => s.val)
      .map(
        (s) =>
          `<div style="flex:1;min-width:80px;background:#f0f4ff;border-radius:6px;padding:10px;text-align:center;"><div style="font-size:9px;color:#6b7280;text-transform:uppercase;">${s.label}</div><div style="font-size:16px;font-weight:800;color:#1e3a5f;">${s.val}</div></div>`
      )
      .join("")}
  </div>

  <!-- Dados Principais -->
  ${sectionTitle("Dados Principais")}
  <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
    ${row("Tipo", property.type)}
    ${row("Padrão", property.padrao)}
    ${row("Condição", property.condicao)}
    ${row("Área Útil", property.area ? `${property.area} m²` : null)}
    ${row("Área Privativa", property.privateArea ? `${property.privateArea} m²` : null)}
    ${row("Quartos", property.bedrooms)}
    ${row("Banheiros", property.bathrooms)}
    ${row("Vagas", property.parking)}
    ${row("Elevadores", property.elevadores)}
    ${row("Decorado", property.decorated ? "Sim" : null)}
    ${row("Vista Mar", property.seaView ? "Sim" : null)}
    ${row("Aceita Permuta", property.acceptsExchange ? "Sim" : null)}
  </table>

  <!-- Valores -->
  ${sectionTitle("Valores e Condições")}
  <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
    ${row("Preço", formatCurrency(property.price))}
    ${row("Parcela", property.priceInstallment ? formatCurrency(property.priceInstallment) + "/mês" : null)}
    ${row("Comissão", property.commission ? `${property.commission}%` : null)}
    ${row("Bônus", property.bonus ? formatCurrency(property.bonus) : null)}
    ${row("Validade Bônus", property.bonusExpiry)}
    ${row("Label de Negócio", property.dealLabel)}
    ${row("Condições de Pagamento", property.paymentConditions?.join(", "))}
  </table>

  <!-- Proprietário -->
  ${property.owner || property.ownerType || property.ownerPhone ? `
  ${sectionTitle("Proprietário")}
  <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
    ${row("Nome", property.owner)}
    ${row("Tipo", property.ownerType)}
    ${row("Telefone", property.ownerPhone)}
    ${row("Exclusividade", property.exclusivityTerm)}
  </table>
  ` : ""}

  <!-- Localização -->
  ${sectionTitle("Localização")}
  <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
    ${row("Endereço", `${property.address}${property.neighborhood ? `, ${property.neighborhood}` : ""}`)}
    ${row("Cidade", property.city)}
    ${row("Empreendimento", property.empreendimento)}
    ${row("Unidade", property.unitNumber)}
    ${row("Box", property.boxNumber)}
    ${row("Quadra", property.quadra)}
    ${row("Lote", property.lote)}
    ${row("Posição Prédio", property.posicaoPredio)}
    ${row("Posição Solar", property.posicaoSolar)}
    ${row("Vista", property.vista)}
    ${row("Local das Chaves", property.keysLocation)}
  </table>

  <!-- Infraestrutura -->
  ${(property.infraestrutura?.length || property.outrasCaracteristicas?.length) ? `
  ${sectionTitle("Infraestrutura e Características")}
  <div style="padding:10px 12px;">
    ${property.infraestrutura?.length ? `<div style="margin-bottom:8px;"><span style="font-weight:600;font-size:11px;color:#374151;">Infraestrutura:</span><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">${property.infraestrutura.map((i) => `<span style="background:#e0f2fe;color:#0369a1;padding:3px 8px;border-radius:10px;font-size:10px;">${i}</span>`).join("")}</div></div>` : ""}
    ${property.outrasCaracteristicas?.length ? `<div><span style="font-weight:600;font-size:11px;color:#374151;">Outras:</span><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">${property.outrasCaracteristicas.map((c) => `<span style="background:#fef3c7;color:#92400e;padding:3px 8px;border-radius:10px;font-size:10px;">${c}</span>`).join("")}</div></div>` : ""}
  </div>
  ` : ""}

  <!-- Descrição -->
  ${property.description ? `
  ${sectionTitle("Descrição")}
  <div style="padding:12px;font-size:11px;line-height:1.7;color:#374151;text-align:justify;">${property.description}</div>
  ` : ""}

  <!-- Links -->
  ${(property.linkVideo || property.linkMaterial || property.link360) ? `
  ${sectionTitle("Links e Mídia")}
  <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
    ${row("Vídeo", property.linkVideo ? `<a href="${property.linkVideo}" style="color:#2563eb;">${property.linkVideo}</a>` : null)}
    ${row("Material", property.linkMaterial ? `<a href="${property.linkMaterial}" style="color:#2563eb;">${property.linkMaterial}</a>` : null)}
    ${row("Tour 360°", property.link360 ? `<a href="${property.link360}" style="color:#2563eb;">${property.link360}</a>` : null)}
  </table>
  ` : ""}

  <!-- Galeria -->
  ${galleryB64.filter(Boolean).length > 0 ? `
  ${sectionTitle("Galeria de Fotos")}
  <div style="display:flex;flex-wrap:wrap;gap:6px;padding:10px 0;">
    ${galleryB64.filter(Boolean).map((b64) => `<img src="${b64}" style="width:32%;height:140px;object-fit:cover;border-radius:4px;border:1px solid #e5e7eb;" />`).join("")}
  </div>
  ` : ""}

  <!-- Footer -->
  <div style="margin-top:20px;padding:12px 16px;background:#f9fafb;border-radius:6px;border:1px solid #e5e7eb;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:10px;color:#6b7280;">
    <div>Corretor: <strong style="color:#1f2937;">${property.broker}</strong></div>
    <div>Cadastro: ${new Date(property.createdAt).toLocaleDateString("pt-BR")}</div>
    ${property.updatedAt ? `<div>Atualizado: ${new Date(property.updatedAt).toLocaleDateString("pt-BR")}</div>` : ""}
    ${property.views ? `<div>Visualizações: ${property.views}</div>` : ""}
  </div>

  <div style="text-align:center;margin-top:12px;font-size:9px;color:#9ca3af;">Relatório gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</div>
</div>`;

  // Generate PDF
  const container = document.createElement("div");
  container.style.width = "210mm";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    await html2pdf()
      .set({
        margin: [15, 15, 15, 15],
        filename: `${property.code || property.id}_${property.title.replace(/\s+/g, "_")}.pdf`,
        image: { type: "jpeg", quality: 0.95 },
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
