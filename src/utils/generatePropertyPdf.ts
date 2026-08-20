import { Property } from "@/data/mockData";

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

export async function generatePropertyPdf(property: Property) {
  const html2pdf = (await import("html2pdf.js")).default;

  // Collect all images (main + gallery), de-duped
  const allUrls = Array.from(new Set([property.image, ...(property.images || [])].filter(Boolean) as string[]));
  const imagesB64 = (await Promise.all(allUrls.map((u) => imageToBase64(u)))).filter(Boolean) as string[];

  const html = `
<div style="font-family:'Segoe UI',Arial,sans-serif;color:#1f2937;">
  <h1 style="font-size:22px;font-weight:800;margin:0 0 4px;color:#1e3a5f;text-align:center;">${property.title}</h1>
  ${property.code ? `<p style="text-align:center;font-size:11px;color:#6b7280;margin:0 0 16px;">Código: ${property.code}</p>` : `<div style="margin-bottom:16px;"></div>`}
  ${imagesB64.length === 0
    ? `<p style="text-align:center;color:#9ca3af;font-size:12px;">Sem fotos cadastradas.</p>`
    : imagesB64.map((b64) => `<div style="page-break-inside:avoid;margin-bottom:12px;text-align:center;"><img src="${b64}" style="max-width:100%;max-height:240mm;object-fit:contain;border-radius:6px;" /></div>`).join("")}
</div>`;

  const filename = `${property.code || property.id}_${property.title.replace(/\s+/g, "_")}_fotos.pdf`;

  const container = document.createElement("div");
  // Renderização fora da tela: o conteúdo nunca deve aparecer na página
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "210mm";
  container.style.zIndex = "-1";
  container.style.pointerEvents = "none";
  container.setAttribute("aria-hidden", "true");
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const blob: Blob = await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename,
        image: { type: "jpeg", quality: 0.92 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      } as any)
      .from(container)
      .outputPdf("blob");

    downloadBlob(blob, filename);
  } finally {
    container.remove();
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
