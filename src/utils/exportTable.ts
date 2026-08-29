/**
 * Exportação da Tabela de Imóveis para PDF (com links clicáveis) e imagem PNG/JPG.
 * O layout exportado é exatamente o mesmo do preview: cada página é um nó
 * `[data-table-page]` renderizado em tamanho real e capturado com html2canvas.
 */

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { FormatDef } from "@/lib/tabelaTemplates";

const SCALE = 2;

async function capture(node: HTMLElement, bg: string) {
  return html2canvas(node, {
    scale: SCALE,
    useCORS: true,
    backgroundColor: bg,
    logging: false,
    windowWidth: node.offsetWidth,
    windowHeight: node.offsetHeight,
  });
}

function collectLinks(page: HTMLElement) {
  const pageRect = page.getBoundingClientRect();
  const scaleFix = page.offsetWidth / pageRect.width || 1;
  return Array.from(page.querySelectorAll<HTMLElement>("[data-pdf-link]")).map(el => {
    const r = el.getBoundingClientRect();
    return {
      url: el.dataset.pdfLink as string,
      x: (r.left - pageRect.left) * scaleFix,
      y: (r.top - pageRect.top) * scaleFix,
      w: r.width * scaleFix,
      h: r.height * scaleFix,
    };
  });
}

export function fileBaseName(titulo: string) {
  const date = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
  const slug = (titulo || "Tabela-Imoveis")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "Tabela-Imoveis"}-${date}`;
}

/** Gera o PDF a partir das páginas renderizadas. Retorna o Blob gerado. */
export async function exportTablePdf(
  pages: HTMLElement[],
  format: FormatDef,
  bg: string,
  fileName: string
): Promise<Blob> {
  const pdfSpec = format.pdf ?? {
    format: [format.width * 0.2646, format.height * 0.2646] as [number, number],
    orientation: (format.orientation === "landscape" ? "landscape" : "portrait") as "landscape" | "portrait",
  };

  const pdf = new jsPDF({ unit: "mm", format: pdfSpec.format, orientation: pdfSpec.orientation });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const links = collectLinks(page);
    const canvas = await capture(page, bg);
    if (i > 0) pdf.addPage(pdfSpec.format, pdfSpec.orientation);
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.94), "JPEG", 0, 0, pw, ph, undefined, "FAST");

    const kx = pw / page.offsetWidth;
    const ky = ph / page.offsetHeight;
    links.forEach(l => pdf.link(l.x * kx, l.y * ky, l.w * kx, l.h * ky, { url: l.url }));
  }

  const blob = pdf.output("blob");
  pdf.save(`${fileName}.pdf`);
  return blob;
}

/** Gera imagens de alta resolução (uma por página). */
export async function exportTableImages(
  pages: HTMLElement[],
  bg: string,
  fileName: string,
  type: "png" | "jpg"
) {
  for (let i = 0; i < pages.length; i++) {
    const canvas = await capture(pages[i], bg);
    const mime = type === "png" ? "image/png" : "image/jpeg";
    const url = canvas.toDataURL(mime, 0.95);
    const a = document.createElement("a");
    a.href = url;
    a.download = pages.length > 1 ? `${fileName}-${i + 1}.${type}` : `${fileName}.${type}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}
