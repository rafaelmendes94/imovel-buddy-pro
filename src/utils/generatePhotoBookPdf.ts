/**
 * Gerador profissional de "book de fotos" em PDF (A4 paisagem).
 * Capa com foto de destaque, ficha resumida, páginas de fotos com
 * cabeçalho/rodapé, numeração e página final de contato.
 */

export interface PhotoBookData {
  title: string;
  code?: string | null;
  price?: number | null;
  priceInstallment?: number | null;
  address?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  status?: string | null;
  type?: string | null;
  empreendimento?: string | null;
  unit?: string | null;
  quadra?: string | null;
  lote?: string | null;
  box?: string | null;
  area?: number | null;
  privateArea?: number | null;
  bedrooms?: number | null;
  suites?: number | null;
  bathrooms?: number | null;
  parking?: number | null;
  description?: string | null;
  features?: string[];
  brokerName?: string | null;
  brokerPhone?: string | null;
  agencyName?: string | null;
  images: string[];
  pageUrl?: string | null;
}

const BRAND = { r: 15, g: 58, b: 102 };      // primary
const ACCENT = { r: 42, g: 155, b: 238 };    // accent
const MUTED = { r: 120, g: 132, b: 148 };

const money = (v?: number | null) =>
  v == null || !isFinite(Number(v))
    ? ""
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(Number(v));

type Loaded = { data: string; w: number; h: number };

async function loadImage(src: string): Promise<Loaded | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = src;
    });
    const maxSide = 1800;
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { data: canvas.toDataURL("image/jpeg", 0.88), w: canvas.width, h: canvas.height };
  } catch {
    return null;
  }
}

export async function generatePhotoBookPdf(d: PhotoBookData) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
  const W = pdf.internal.pageSize.getWidth();   // 297
  const H = pdf.internal.pageSize.getHeight();  // 210

  const setOpacity = (o: number) => {
    try {
      // @ts-ignore GState existe em runtime
      pdf.setGState(new (pdf as any).GState({ opacity: o }));
    } catch {}
  };

  const urls = Array.from(new Set((d.images || []).filter(Boolean)));
  const loaded = (await Promise.all(urls.map(loadImage))).filter(Boolean) as Loaded[];

  const locationLine = [d.address, d.neighborhood, d.city].filter(Boolean).join(" • ");
  const unitLine = [
    d.empreendimento,
    d.unit ? `Apto/Unid. ${d.unit}` : null,
    d.quadra ? `Quadra ${d.quadra}` : null,
    d.lote ? `Lote ${d.lote}` : null,
    d.box ? `Box ${d.box}` : null,
  ].filter(Boolean).join(" • ");

  const specs: Array<[string, string]> = [];
  if (d.area) specs.push([`${d.area} m²`, "Área total"]);
  if (d.privateArea) specs.push([`${d.privateArea} m²`, "Área privativa"]);
  if (d.bedrooms) specs.push([String(d.bedrooms), d.bedrooms === 1 ? "Dormitório" : "Dormitórios"]);
  if (d.suites) specs.push([String(d.suites), d.suites === 1 ? "Suíte" : "Suítes"]);
  if (d.bathrooms) specs.push([String(d.bathrooms), "Banheiros"]);
  if (d.parking) specs.push([String(d.parking), "Vagas"]);

  /* ---------------------------------- CAPA ---------------------------------- */
  const drawCover = () => {
    pdf.setFillColor(BRAND.r, BRAND.g, BRAND.b);
    pdf.rect(0, 0, W, H, "F");

    const hero = loaded[0];
    if (hero) {
      // cover-fit no topo (0 -> 140mm)
      const boxH = 140;
      const ratio = hero.w / hero.h;
      let w = W, h = W / ratio;
      if (h < boxH) { h = boxH; w = boxH * ratio; }
      pdf.addImage(hero.data, "JPEG", (W - w) / 2, (boxH - h) / 2, w, h, undefined, "FAST");
      // véu escuro para leitura
      setOpacity(0.35);
      pdf.setFillColor(8, 22, 38);
      pdf.rect(0, 90, W, 50, "F");
      setOpacity(1);
    }

    // faixa inferior escura
    pdf.setFillColor(BRAND.r, BRAND.g, BRAND.b);
    pdf.rect(0, 140, W, H - 140, "F");
    pdf.setFillColor(ACCENT.r, ACCENT.g, ACCENT.b);
    pdf.rect(0, 138, W, 2, "F");

    // status / tipo (badge)
    let bx = 18;
    const badges = [d.status, d.type].filter(Boolean) as string[];
    pdf.setFontSize(9);
    badges.forEach((b) => {
      const tw = pdf.getTextWidth(b.toUpperCase()) + 8;
      pdf.setFillColor(ACCENT.r, ACCENT.g, ACCENT.b);
      pdf.roundedRect(bx, 148, tw, 7, 1.5, 1.5, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.text(b.toUpperCase(), bx + 4, 152.9);
      bx += tw + 4;
    });

    // título
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(24);
    const titleLines = pdf.splitTextToSize(d.title || "Imóvel", W - 120);
    pdf.text(titleLines.slice(0, 2), 18, 166);

    // localização
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10.5);
    pdf.setTextColor(205, 220, 235);
    let ly = 166 + (titleLines.length > 1 ? 8 : 0) + 8;
    if (locationLine) { pdf.text(pdf.splitTextToSize(locationLine, W - 120)[0], 18, ly); ly += 6; }
    if (unitLine) { pdf.text(pdf.splitTextToSize(unitLine, W - 120)[0], 18, ly); }

    // preço à direita
    const priceTxt = money(d.price);
    if (priceTxt) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.setTextColor(255, 255, 255);
      pdf.text(priceTxt, W - 18, 166, { align: "right" });
      if (d.priceInstallment) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9.5);
        pdf.setTextColor(205, 220, 235);
        pdf.text(`Parcelado: ${money(d.priceInstallment)}`, W - 18, 174, { align: "right" });
      }
    }
    if (d.code) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(205, 220, 235);
      pdf.text(`Código ${d.code}`, W - 18, 152.9, { align: "right" });
    }

    // faixa de especificações
    if (specs.length) {
      pdf.setFillColor(255, 255, 255);
      setOpacity(0.1);
      pdf.roundedRect(18, 184, W - 36, 16, 2, 2, "F");
      setOpacity(1);
      const colW = (W - 36) / specs.length;
      specs.forEach(([v, l], i) => {
        const cx = 18 + colW * i + colW / 2;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(255, 255, 255);
        pdf.text(v, cx, 191, { align: "center" });
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);
        pdf.setTextColor(190, 208, 226);
        pdf.text(l.toUpperCase(), cx, 196.5, { align: "center" });
      });
    }
  };

  /* -------------------------- CABEÇALHO / RODAPÉ ---------------------------- */
  const drawFrame = (pageLabel: string, pageNo: number, total: number) => {
    pdf.setFillColor(BRAND.r, BRAND.g, BRAND.b);
    pdf.rect(0, 0, W, 12, "F");
    pdf.setFillColor(ACCENT.r, ACCENT.g, ACCENT.b);
    pdf.rect(0, 12, W, 0.8, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.text(pdf.splitTextToSize(d.title || "Imóvel", W / 2)[0], 12, 8);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(210, 226, 240);
    pdf.text(pageLabel, W - 12, 8, { align: "right" });

    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.line(12, H - 12, W - 12, H - 12);
    pdf.setFontSize(8);
    pdf.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    const left = [d.brokerName, d.brokerPhone, d.agencyName].filter(Boolean).join("  |  ");
    if (left) pdf.text(left, 12, H - 6);
    pdf.text(`${pageNo} / ${total}`, W - 12, H - 6, { align: "right" });
  };

  /* ------------------------------- CONSTRUÇÃO ------------------------------- */
  const detailTexts: string[] = [];
  if (d.description) detailTexts.push(d.description.trim());
  const hasDetails = detailTexts.length > 0 || (d.features && d.features.length > 0);

  const photoPages = loaded.length;
  const total = 1 + photoPages + (hasDetails ? 1 : 0);

  drawCover();

  loaded.forEach((img, i) => {
    pdf.addPage();
    drawFrame(`Fotos ${i + 1} de ${photoPages}`, 2 + i, total);
    const top = 20, bottom = H - 20;
    const boxW = W - 32, boxH = bottom - top;
    const ratio = img.w / img.h;
    let w = boxW, h = boxW / ratio;
    if (h > boxH) { h = boxH; w = boxH * ratio; }
    const x = (W - w) / 2, y = top + (boxH - h) / 2;
    // sombra suave
    setOpacity(0.08);
    pdf.setFillColor(0, 0, 0);
    pdf.roundedRect(x + 1.2, y + 1.6, w, h, 1.5, 1.5, "F");
    setOpacity(1);
    pdf.addImage(img.data, "JPEG", x, y, w, h, undefined, "FAST");
    pdf.setDrawColor(230, 236, 243);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(x, y, w, h, 1.5, 1.5, "S");
  });

  if (hasDetails) {
    pdf.addPage();
    drawFrame("Informações do imóvel", total, total);
    let y = 26;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(BRAND.r, BRAND.g, BRAND.b);
    pdf.text("Sobre o imóvel", 16, y);
    y += 7;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(60, 70, 84);
    if (detailTexts.length) {
      const lines = pdf.splitTextToSize(detailTexts.join("\n\n"), (W - 32) * 0.58);
      lines.slice(0, 40).forEach((ln: string) => { pdf.text(ln, 16, y); y += 5.4; });
    } else {
      pdf.text("Descrição não informada.", 16, y);
      y += 5.4;
    }

    if (d.features?.length) {
      const cx = 16 + (W - 32) * 0.62;
      let fy = 26;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.setTextColor(BRAND.r, BRAND.g, BRAND.b);
      pdf.text("Características", cx, fy);
      fy += 7;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9.5);
      pdf.setTextColor(60, 70, 84);
      d.features.slice(0, 28).forEach((f) => {
        pdf.setFillColor(ACCENT.r, ACCENT.g, ACCENT.b);
        pdf.circle(cx + 1.2, fy - 1.2, 0.9, "F");
        pdf.text(pdf.splitTextToSize(f, (W - 32) * 0.34)[0], cx + 5, fy);
        fy += 5.2;
      });
    }

    if (d.pageUrl) {
      pdf.setFontSize(8.5);
      pdf.setTextColor(MUTED.r, MUTED.g, MUTED.b);
      pdf.text(d.pageUrl, 16, H - 16);
    }
  }

  const safe = (d.title || "imovel").replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_|_$/g, "");
  pdf.save(`${d.code ? d.code + "_" : ""}${safe}_book.pdf`);
}
