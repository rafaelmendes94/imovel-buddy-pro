/**
 * Apresentação premium do imóvel em PDF (A4 paisagem, paleta verde).
 * Capa = primeira foto (full bleed) + demais fotos, uma por página + página final de informações.
 * Retorna um Blob para upload no Storage (nenhum dado interno é exibido).
 */

export interface PresentationData {
  id?: string | null;
  title?: string | null;
  code?: string | null;
  type?: string | null;
  status?: string | null;
  empreendimento?: string | null;
  unit?: string | null;
  quadra?: string | null;
  lote?: string | null;
  price?: number | null;
  city?: string | null;
  neighborhood?: string | null;
  address?: string | null;
  number?: string | null;
  state?: string | null;
  area?: number | null;
  privateArea?: number | null;
  bedrooms?: number | null;
  suites?: number | null;
  bathrooms?: number | null;
  lavabo?: number | null;
  parking?: number | null;
  posicaoSolar?: string | null;
  condicao?: string | null;
  decorado?: boolean | null;
  vistaMar?: boolean | null;
  vista?: string | null;
  padrao?: string | null;
  description?: string | null;
  features?: string[];
  images: string[];
  pageUrl?: string | null;
}

export interface PresentationResult {
  blob: Blob;
  photos: number;
  failed: number;
  pages: number;
  bytes: number;
}

/* ------------------------------- paleta ---------------------------------- */
const DARK = [22, 61, 46] as const;      // verde escuro
const OLIVE = [92, 128, 62] as const;    // verde oliva
const LIGHT = [223, 238, 220] as const;  // verde claro
const GRAY = [108, 122, 112] as const;

const money = (v?: number | null) =>
  v == null || !isFinite(Number(v)) || Number(v) <= 0
    ? ""
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(Number(v));

const num = (v?: number | null) =>
  v == null || !isFinite(Number(v)) || Number(v) <= 0 ? null : Number(v);

const m2 = (v: number) =>
  `${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} m²`;

type Loaded = { data: string; w: number; h: number };

async function loadImage(src: string, maxSide = 1600, quality = 0.85): Promise<Loaded | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.crossOrigin = "anonymous";
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = src;
      });
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const out = { data: canvas.toDataURL("image/jpeg", quality), w: canvas.width, h: canvas.height };
      canvas.width = 0;
      canvas.height = 0;
      return out;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  return null;
}

async function qrDataUrl(text: string): Promise<string | null> {
  try {
    const QR = await import("qrcode");
    return await QR.toDataURL(text, { margin: 1, width: 320, color: { dark: "#163D2E", light: "#FFFFFF" } });
  } catch {
    return null;
  }
}

export async function generatePropertyPresentationPdf(d: PresentationData): Promise<PresentationResult> {
  const urls = Array.from(new Set((d.images || []).filter(Boolean)));
  if (urls.length === 0) throw new Error("Adicione pelo menos uma foto ao imóvel antes de gerar o PDF.");

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
  const W = pdf.internal.pageSize.getWidth();   // 297
  const H = pdf.internal.pageSize.getHeight();  // 210

  const op = (o: number) => {
    try {
      // @ts-ignore GState existe em runtime
      pdf.setGState(new (pdf as any).GState({ opacity: o }));
    } catch {}
  };

  /* ------------------------- dados públicos apenas ------------------------- */
  const kind = (d.type || "Imóvel").toUpperCase();
  const heading = (d.empreendimento || d.title || "Imóvel").toUpperCase();
  const place = [d.city, d.neighborhood].filter(Boolean).join(" • ");
  const priceTxt = money(d.price);

  const chips: Array<{ value: string; label: string; icon: "ruler" | "bed" | "suite" | "car" | "bath" }> = [];
  const pa = num(d.privateArea), ta = num(d.area);
  if (pa) chips.push({ value: m2(pa), label: "Privativos", icon: "ruler" });
  else if (ta) chips.push({ value: m2(ta), label: "Área total", icon: "ruler" });
  const bed = num(d.bedrooms); if (bed) chips.push({ value: String(bed), label: bed === 1 ? "Dormitório" : "Dormitórios", icon: "bed" });
  const su = num(d.suites); if (su) chips.push({ value: String(su), label: su === 1 ? "Suíte" : "Suítes", icon: "suite" });
  const ba = num(d.bathrooms); if (ba) chips.push({ value: String(ba), label: ba === 1 ? "Banheiro" : "Banheiros", icon: "bath" });
  const pk = num(d.parking); if (pk) chips.push({ value: String(pk), label: pk === 1 ? "Vaga" : "Vagas", icon: "car" });

  const highlight = (() => {
    if (d.vistaMar) return "Vista para o mar";
    if (d.vista) return String(d.vista);
    if (su && su >= 3) return `${su} suítes`;
    if (d.padrao && /alto/i.test(d.padrao)) return "Alto padrão";
    if (d.decorado) return "Mobiliado e decorado";
    return "";
  })();

  const infoList = (() => {
    const out: string[] = [];
    if (d.decorado) out.push("Mobiliado e decorado");
    if (d.condicao) out.push(String(d.condicao));
    if (d.vistaMar) out.push("Vista para o mar");
    else if (d.vista) out.push(`Vista ${String(d.vista).toLowerCase()}`);
    if (num(d.lavabo)) out.push("Lavabo");
    if (d.posicaoSolar) out.push(`Posição solar ${String(d.posicaoSolar).toLowerCase()}`);
    (d.features || []).forEach((f) => f && out.push(String(f)));
    return Array.from(new Set(out.map((s) => s.trim()).filter(Boolean))).slice(0, 6);
  })();

  /* ------------------------------ helpers ---------------------------------- */
  const icon = (name: string, x: number, y: number, s = 4.2) => {
    pdf.setDrawColor(DARK[0], DARK[1], DARK[2]);
    pdf.setLineWidth(0.35);
    if (name === "ruler") {
      pdf.rect(x, y - s * 0.7, s * 1.4, s * 0.7, "S");
      pdf.line(x + s * 0.45, y - s * 0.7, x + s * 0.45, y - s * 0.35);
      pdf.line(x + s * 0.9, y - s * 0.7, x + s * 0.9, y - s * 0.35);
    } else if (name === "bed") {
      pdf.line(x, y, x, y - s * 0.75);
      pdf.line(x, y - s * 0.35, x + s * 1.5, y - s * 0.35);
      pdf.line(x + s * 1.5, y - s * 0.35, x + s * 1.5, y);
      pdf.roundedRect(x + s * 0.15, y - s * 0.72, s * 0.55, s * 0.35, 0.4, 0.4, "S");
    } else if (name === "suite") {
      pdf.roundedRect(x, y - s * 0.75, s * 1.5, s * 0.75, 0.6, 0.6, "S");
      pdf.line(x + s * 0.9, y - s * 0.75, x + s * 0.9, y);
    } else if (name === "bath") {
      pdf.line(x, y - s * 0.35, x + s * 1.4, y - s * 0.35);
      pdf.line(x + s * 0.15, y - s * 0.35, x + s * 0.3, y);
      pdf.line(x + s * 1.25, y - s * 0.35, x + s * 1.1, y);
      pdf.line(x + s * 0.3, y - s * 0.35, x + s * 0.3, y - s * 0.8);
    } else if (name === "car") {
      pdf.roundedRect(x, y - s * 0.45, s * 1.6, s * 0.4, 0.5, 0.5, "S");
      pdf.line(x + s * 0.25, y - s * 0.45, x + s * 0.5, y - s * 0.75);
      pdf.line(x + s * 1.35, y - s * 0.45, x + s * 1.1, y - s * 0.75);
      pdf.line(x + s * 0.5, y - s * 0.75, x + s * 1.1, y - s * 0.75);
      pdf.circle(x + s * 0.3, y, 0.6, "S");
      pdf.circle(x + s * 1.3, y, 0.6, "S");
    }
  };

  /** degradê horizontal simulado em faixas */
  const gradientLeft = (width: number, from: readonly number[], alphaMax: number) => {
    const steps = 26;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      op(alphaMax * (1 - t));
      pdf.setFillColor(from[0], from[1], from[2]);
      pdf.rect((width / steps) * i, 0, width / steps + 0.4, H, "F");
    }
    op(1);
  };

  const coverFit = (img: Loaded, x: number, y: number, bw: number, bh: number) => {
    const r = img.w / img.h;
    let w = bw, h = bw / r;
    if (h < bh) { h = bh; w = bh * r; }
    pdf.addImage(img.data, "JPEG", x + (bw - w) / 2, y + (bh - h) / 2, w, h, undefined, "FAST");
  };

  const footer = (pageNo: number, total: number) => {
    const left = [d.empreendimento || d.title, d.city].filter(Boolean).join(" • ");
    op(0.55);
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, H - 10, W, 10, "F");
    op(1);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(DARK[0], DARK[1], DARK[2]);
    if (left) pdf.text(left, 12, H - 3.8);
    pdf.text(`${String(pageNo).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, W - 12, H - 3.8, { align: "right" });
  };

  /* ------------------------------- capa ------------------------------------ */
  let failed = 0;
  let coverIdx = -1;
  let cover: Loaded | null = null;
  for (let i = 0; i < urls.length; i++) {
    const img = await loadImage(urls[i], 1900, 0.88);
    if (img) { cover = img; coverIdx = i; break; }
    failed++;
  }
  if (!cover) throw new Error("Não foi possível carregar nenhuma foto do imóvel.");

  const totalPhotos = urls.length - failed; // estimativa; ajustada no rodapé final
  const totalPagesEstimate = 1 + Math.max(0, urls.length - 1) + 1;

  pdf.setFillColor(LIGHT[0], LIGHT[1], LIGHT[2]);
  pdf.rect(0, 0, W, H, "F");
  coverFit(cover, 0, 0, W, H);
  gradientLeft(W * 0.62, [255, 255, 255], 0.9);
  gradientLeft(W * 0.34, LIGHT, 0.35);

  let y = 30;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(OLIVE[0], OLIVE[1], OLIVE[2]);
  pdf.text(`${kind} À VENDA`, 20, y);
  y += 12;

  pdf.setFontSize(30);
  pdf.setTextColor(DARK[0], DARK[1], DARK[2]);
  const hLines = pdf.splitTextToSize(heading, W * 0.5).slice(0, 2);
  hLines.forEach((ln: string) => { pdf.text(ln, 20, y); y += 12; });

  if (place) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    pdf.text(place, 20, y);
    y += 9;
  }
  if (highlight) {
    pdf.setFont("helvetica", "bolditalic");
    pdf.setFontSize(11.5);
    pdf.setTextColor(OLIVE[0], OLIVE[1], OLIVE[2]);
    pdf.text(highlight, 20, y);
    y += 10;
  }

  if (chips.length) {
    let cx = 20;
    chips.slice(0, 5).forEach((c) => {
      icon(c.icon, cx, y + 1, 4);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10.5);
      pdf.setTextColor(DARK[0], DARK[1], DARK[2]);
      pdf.text(c.value, cx + 9, y);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.2);
      pdf.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
      pdf.text(c.label.toUpperCase(), cx + 9, y + 4.2);
      cx += Math.max(34, pdf.getTextWidth(c.label) + 24);
    });
    y += 14;
  }

  if (infoList.length) {
    const cardW = 108, cardH = 12 + infoList.length * 6.4;
    op(0.82);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(20, y, cardW, cardH, 3, 3, "F");
    op(1);
    pdf.setDrawColor(LIGHT[0], LIGHT[1], LIGHT[2]);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(20, y, cardW, cardH, 3, 3, "S");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(DARK[0], DARK[1], DARK[2]);
    pdf.text("Informações", 26, y + 8);
    let iy = y + 15;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.6);
    infoList.forEach((f) => {
      pdf.setTextColor(OLIVE[0], OLIVE[1], OLIVE[2]);
      pdf.text("✓", 26, iy);
      pdf.setTextColor(60, 72, 64);
      pdf.text(pdf.splitTextToSize(f, cardW - 20)[0], 31, iy);
      iy += 6.4;
    });
    y += cardH + 8;
  }

  if (priceTxt) {
    pdf.setFontSize(17);
    pdf.setFont("helvetica", "bold");
    const pw = pdf.getTextWidth(priceTxt) + 22;
    const py = Math.min(H - 26, y);
    const steps = 18;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      pdf.setFillColor(
        Math.round(OLIVE[0] + (DARK[0] - OLIVE[0]) * t),
        Math.round(OLIVE[1] + (DARK[1] - OLIVE[1]) * t),
        Math.round(OLIVE[2] + (DARK[2] - OLIVE[2]) * t),
      );
      if (i === 0) pdf.roundedRect(20, py, pw, 14, 7, 7, "F");
      else pdf.rect(20 + (pw / steps) * i, py, pw / steps + 0.4, 14, "F");
    }
    pdf.setFillColor(DARK[0], DARK[1], DARK[2]);
    pdf.roundedRect(20 + pw - 14, py, 14, 14, 7, 7, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.text(priceTxt, 20 + pw / 2, py + 9.4, { align: "center" });
  }
  footer(1, totalPagesEstimate);

  /* --------------------------- páginas de fotos ---------------------------- */
  let added = 1;
  const photoPagesInfo: number[] = [];
  for (let i = 0; i < urls.length; i++) {
    if (i === coverIdx) continue;
    const img = await loadImage(urls[i], 1600, 0.85);
    if (!img) { failed++; continue; }
    pdf.addPage();
    added++;
    photoPagesInfo.push(added);
    const ratio = img.w / img.h;
    if (ratio >= 1.15) {
      coverFit(img, 0, 0, W, H);
    } else {
      // fundo: mesma foto ampliada e esmaecida; foto original centralizada
      op(0.35);
      coverFit(img, 0, 0, W, H);
      op(1);
      op(0.55);
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, W, H, "F");
      op(1);
      const bh = H - 24, bw = W - 40;
      let w = bw, h = bw / ratio;
      if (h > bh) { h = bh; w = bh * ratio; }
      pdf.addImage(img.data, "JPEG", (W - w) / 2, (H - h) / 2, w, h, undefined, "FAST");
    }
    footer(added, totalPagesEstimate);
  }

  /* ---------------------------- página final ------------------------------- */
  pdf.addPage();
  added++;
  pdf.setFillColor(252, 253, 251);
  pdf.rect(0, 0, W, H, "F");
  pdf.setFillColor(DARK[0], DARK[1], DARK[2]);
  pdf.rect(0, 0, W, 3, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.setTextColor(DARK[0], DARK[1], DARK[2]);
  pdf.text("INFORMAÇÕES DO IMÓVEL", 18, 20);

  const rows: Array<[string, string]> = [];
  if (pa) rows.push(["Área privativa", m2(pa)]);
  if (ta) rows.push(["Área total", m2(ta)]);
  if (bed) rows.push(["Dormitórios", String(bed)]);
  if (su) rows.push(["Suítes", String(su)]);
  if (ba) rows.push(["Banheiros", String(ba)]);
  if (num(d.lavabo)) rows.push(["Lavabo", String(num(d.lavabo))]);
  if (pk) rows.push(["Vagas", String(pk)]);
  if (d.posicaoSolar) rows.push(["Posição solar", String(d.posicaoSolar)]);
  if (d.condicao) rows.push(["Mobiliado", String(d.condicao)]);
  if (d.decorado) rows.push(["Decorado", "Sim"]);
  if (d.empreendimento) rows.push(["Empreendimento", String(d.empreendimento)]);
  if (d.unit) rows.push(["Unidade", String(d.unit)]);
  if (d.quadra) rows.push(["Quadra", String(d.quadra)]);
  if (d.lote) rows.push(["Lote", String(d.lote)]);
  if (d.type) rows.push(["Tipo", String(d.type)]);
  if (priceTxt) rows.push(["Valor", priceTxt]);

  const colW = (W - 36) / 3;
  rows.slice(0, 15).forEach(([k, v], i) => {
    const cx = 18 + colW * (i % 3);
    const cy = 30 + Math.floor(i / 3) * 16;
    pdf.setFillColor(LIGHT[0], LIGHT[1], LIGHT[2]);
    op(0.5);
    pdf.roundedRect(cx, cy, colW - 6, 13, 2, 2, "F");
    op(1);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    pdf.text(k.toUpperCase(), cx + 4, cy + 5);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9.5);
    pdf.setTextColor(DARK[0], DARK[1], DARK[2]);
    pdf.text(pdf.splitTextToSize(v, colW - 14)[0], cx + 4, cy + 10.6);
  });

  let fy = 30 + Math.ceil(Math.min(rows.length, 15) / 3) * 16 + 8;

  if (d.description) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11.5);
    pdf.setTextColor(DARK[0], DARK[1], DARK[2]);
    pdf.text("Sobre o imóvel", 18, fy);
    fy += 6;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(60, 72, 64);
    const clean = String(d.description)
      .split("\n")
      .filter((l) => !/(comiss|propriet|chave|telefone|whats|\(\d{2}\)\s?\d)/i.test(l))
      .join("\n");
    pdf.splitTextToSize(clean, W * 0.62).slice(0, 12).forEach((ln: string) => {
      pdf.text(ln, 18, fy);
      fy += 4.8;
    });
    fy += 4;
  }

  const locLines = [
    [d.address, d.number].filter(Boolean).join(", "),
    d.neighborhood || "",
    [d.city, d.state].filter(Boolean).join(" / "),
  ].filter(Boolean);
  if (locLines.length) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11.5);
    pdf.setTextColor(DARK[0], DARK[1], DARK[2]);
    pdf.text("Localização", 18, fy);
    fy += 6;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(60, 72, 64);
    locLines.forEach((l) => { pdf.text(String(l), 18, fy); fy += 4.8; });
  }

  if (d.pageUrl) {
    const qr = await qrDataUrl(d.pageUrl);
    if (qr) {
      const qx = W - 66, qy = H - 76;
      pdf.addImage(qr, "PNG", qx, qy, 42, 42, undefined, "FAST");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(DARK[0], DARK[1], DARK[2]);
      pdf.splitTextToSize("Veja todos os detalhes deste imóvel", 48).forEach((ln: string, i: number) => {
        pdf.text(ln, qx, qy + 48 + i * 4.6);
      });
    }
  }
  footer(added, added);

  const blob = pdf.output("blob") as Blob;
  return {
    blob,
    photos: urls.length - failed,
    failed,
    pages: added,
    bytes: blob.size,
  };
}
