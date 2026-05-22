import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Building2, Paintbrush, Wrench, DollarSign, Shield, Zap, Home, ChevronRight, X, Handshake, Scale, Truck, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import logoMvBroker from "@/assets/logo-mv-broker.png";

interface Partner {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  description: string;
  category: string;
  city?: string | null;
  phone?: string | null;
  rating?: number | null;
  total_ratings?: number | null;
}

const categoryIcons: Record<string, typeof Building2> = {
  "Construtoras": Building2,
  "Imobiliárias": Home,
  "Engenharia": Wrench,
  "Financeiro": DollarSign,
  "Seguros": Shield,
  "Arquitetura": Paintbrush,
  "Energia": Zap,
  "Reformas": Wrench,
  "Jurídico": Scale,
  "Serviços": Truck,
};

const categoryColors: Record<string, string> = {
  "Construtoras": "bg-blue-950/10 text-blue-950 border-blue-900/20",
  "Imobiliárias": "bg-blue-600/10 text-blue-700 border-blue-600/20",
  "Engenharia": "bg-slate-800/10 text-slate-800 border-slate-700/20",
  "Financeiro": "bg-sky-500/10 text-sky-700 border-sky-500/20",
  "Seguros": "bg-blue-800/10 text-blue-800 border-blue-800/20",
  "Arquitetura": "bg-cyan-500/10 text-cyan-700 border-cyan-500/20",
  "Energia": "bg-blue-400/10 text-blue-600 border-blue-400/20",
  "Reformas": "bg-indigo-500/10 text-indigo-700 border-indigo-500/20",
  "Jurídico": "bg-blue-900/10 text-blue-900 border-blue-900/20",
  "Serviços": "bg-slate-600/10 text-slate-700 border-slate-600/20",
};

export default function Parceiros() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [allPartners, setAllPartners] = useState<Partner[]>([]);

  useEffect(() => {
    supabase
      .from("partners")
      .select("id, name, slug, logo_url, description, category, city, phone, rating, total_ratings")
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .then(({ data }) => setAllPartners((data as any) || []));
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(allPartners.map(p => p.category))];
    return ["Todos", ...cats.sort()];
  }, [allPartners]);

  const filtered = useMemo(() => {
    return allPartners.filter(p => {
      const matchSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = activeCategory === "Todos" || p.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [searchTerm, activeCategory, allPartners]);

  const grouped = useMemo(() => {
    const groups: Record<string, Partner[]> = {};
    filtered.forEach(p => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const exportPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const allGrouped = [...new Set(allPartners.map(p => p.category))].sort().map(c => [c, allPartners.filter(p => p.category === c)] as [string, Partner[]]);

    // Color palette per category (primary, secondary, accent)
    const palette: Record<string, [number[], number[], number[]]> = {
      "Construtoras":  [[15, 27, 61],    [37, 99, 235],   [251, 191, 36]],
      "Imobiliárias":  [[30, 64, 175],   [59, 130, 246],  [253, 224, 71]],
      "Engenharia":    [[30, 41, 59],    [71, 85, 105],   [234, 179, 8]],
      "Financeiro":    [[6, 78, 59],     [16, 185, 129],  [253, 224, 71]],
      "Seguros":       [[30, 58, 138],   [79, 70, 229],   [251, 191, 36]],
      "Arquitetura":   [[22, 78, 99],    [14, 165, 233],  [254, 215, 170]],
      "Energia":       [[120, 53, 15],   [245, 158, 11],  [253, 230, 138]],
      "Reformas":      [[88, 28, 135],   [139, 92, 246],  [253, 224, 71]],
      "Jurídico":      [[12, 10, 62],    [55, 48, 163],   [212, 175, 55]],
      "Serviços":      [[51, 65, 85],    [100, 116, 139], [251, 191, 36]],
    };
    const colorsFor = (c: string) => palette[c] || [[15, 27, 61], [37, 99, 235], [251, 191, 36]];

    // Draw decorative iconography per category (vector art, no images)
    const drawArt = (cat: string, cx: number, cy: number, size: number, accent: number[]) => {
      doc.setDrawColor(255, 255, 255);
      doc.setFillColor(accent[0], accent[1], accent[2]);
      const s = size;
      switch (cat) {
        case "Construtoras": {
          // Skyline of buildings
          doc.setLineWidth(2);
          const base = cy + s / 2;
          const w = s * 0.16;
          const hs = [0.9, 0.6, 1.0, 0.45, 0.8];
          hs.forEach((h, i) => {
            const x = cx - s / 2 + i * w * 1.15;
            doc.setFillColor(255, 255, 255);
            doc.rect(x, base - s * h, w, s * h, "F");
            doc.setFillColor(accent[0], accent[1], accent[2]);
            for (let r = 0; r < Math.floor(h * 6); r++) {
              for (let c2 = 0; c2 < 2; c2++) {
                doc.rect(x + 4 + c2 * (w / 2), base - s * h + 6 + r * 9, w / 2 - 6, 4, "F");
              }
            }
          });
          break;
        }
        case "Imobiliárias": {
          // House silhouette
          doc.setFillColor(255, 255, 255);
          doc.triangle(cx - s / 2, cy, cx, cy - s / 2, cx + s / 2, cy, "F");
          doc.rect(cx - s / 2.4, cy, s / 1.2, s / 1.8, "F");
          doc.setFillColor(accent[0], accent[1], accent[2]);
          doc.rect(cx - s / 8, cy + s / 8, s / 4, s / 3, "F");
          break;
        }
        case "Engenharia": {
          // Gear
          doc.setFillColor(255, 255, 255);
          for (let i = 0; i < 8; i++) {
            const a = (i * Math.PI) / 4;
            const x = cx + Math.cos(a) * s / 2;
            const y = cy + Math.sin(a) * s / 2;
            doc.rect(x - 8, y - 8, 16, 16, "F");
          }
          doc.circle(cx, cy, s / 2.4, "F");
          doc.setFillColor(accent[0], accent[1], accent[2]);
          doc.circle(cx, cy, s / 6, "F");
          break;
        }
        case "Financeiro": {
          // Bar chart + arrow
          doc.setFillColor(255, 255, 255);
          [0.4, 0.65, 0.85, 1].forEach((h, i) => {
            doc.rect(cx - s / 2 + i * (s / 4) + 4, cy + s / 2 - s * h * 0.7, s / 4 - 8, s * h * 0.7, "F");
          });
          doc.setFillColor(accent[0], accent[1], accent[2]);
          doc.triangle(cx + s / 2 - 12, cy - s / 3, cx + s / 2 + 8, cy - s / 2.2, cx + s / 2 - 4, cy - s / 4, "F");
          break;
        }
        case "Seguros": {
          // Shield
          doc.setFillColor(255, 255, 255);
          doc.triangle(cx - s / 2.2, cy - s / 2.2, cx + s / 2.2, cy - s / 2.2, cx, cy + s / 2, "F");
          doc.rect(cx - s / 2.2, cy - s / 2.2, s / 1.1, s / 4, "F");
          doc.setFillColor(accent[0], accent[1], accent[2]);
          doc.setLineWidth(4);
          doc.setDrawColor(accent[0], accent[1], accent[2]);
          doc.line(cx - s / 6, cy, cx - s / 20, cy + s / 6);
          doc.line(cx - s / 20, cy + s / 6, cx + s / 5, cy - s / 8);
          break;
        }
        case "Arquitetura": {
          // Ruler + triangle
          doc.setFillColor(255, 255, 255);
          doc.triangle(cx - s / 2, cy + s / 2, cx + s / 2, cy + s / 2, cx - s / 2, cy - s / 2, "F");
          doc.setFillColor(accent[0], accent[1], accent[2]);
          for (let i = 1; i < 6; i++) {
            doc.rect(cx - s / 2 + i * (s / 6), cy + s / 2 - 6, 2, 8, "F");
          }
          break;
        }
        case "Energia": {
          // Lightning bolt
          doc.setFillColor(255, 255, 255);
          const pts: [number, number][] = [
            [cx + s / 8, cy - s / 2], [cx - s / 4, cy + s / 12], [cx - s / 30, cy + s / 12],
            [cx - s / 6, cy + s / 2], [cx + s / 3, cy - s / 10], [cx, cy - s / 10],
          ];
          // approximate via two triangles
          doc.triangle(pts[0][0], pts[0][1], pts[1][0], pts[1][1], pts[5][0], pts[5][1], "F");
          doc.triangle(pts[5][0], pts[5][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1], "F");
          doc.triangle(pts[5][0], pts[5][1], pts[3][0], pts[3][1], pts[4][0], pts[4][1], "F");
          break;
        }
        case "Reformas": {
          // Hammer + wrench cross
          doc.setFillColor(255, 255, 255);
          doc.rect(cx - s / 2, cy - 8, s, 16, "F");
          doc.rect(cx - 8, cy - s / 2, 16, s, "F");
          doc.setFillColor(accent[0], accent[1], accent[2]);
          doc.circle(cx - s / 2, cy, 12, "F");
          doc.circle(cx + s / 2, cy, 12, "F");
          break;
        }
        case "Jurídico": {
          // Scales of justice
          doc.setFillColor(255, 255, 255);
          doc.rect(cx - 4, cy - s / 2, 8, s, "F");
          doc.rect(cx - s / 3, cy + s / 2 - 6, s / 1.5, 8, "F");
          doc.setLineWidth(3);
          doc.setDrawColor(255, 255, 255);
          doc.line(cx - s / 2.5, cy - s / 3, cx + s / 2.5, cy - s / 3);
          doc.line(cx - s / 2.5, cy - s / 3, cx - s / 2.5, cy - s / 8);
          doc.line(cx + s / 2.5, cy - s / 3, cx + s / 2.5, cy - s / 8);
          doc.setFillColor(accent[0], accent[1], accent[2]);
          doc.circle(cx - s / 2.5, cy - s / 10, 14, "F");
          doc.circle(cx + s / 2.5, cy - s / 10, 14, "F");
          break;
        }
        case "Serviços": {
          // Truck
          doc.setFillColor(255, 255, 255);
          doc.rect(cx - s / 2, cy - s / 6, s * 0.6, s / 3, "F");
          doc.rect(cx + s / 10, cy, s / 2.5, s / 5, "F");
          doc.setFillColor(accent[0], accent[1], accent[2]);
          doc.circle(cx - s / 3.5, cy + s / 5, 12, "F");
          doc.circle(cx + s / 3.5, cy + s / 5, 12, "F");
          break;
        }
        default: {
          // Handshake-ish abstract: two interlocking circles
          doc.setFillColor(255, 255, 255);
          doc.circle(cx - s / 5, cy, s / 3, "F");
          doc.setFillColor(accent[0], accent[1], accent[2]);
          doc.circle(cx + s / 5, cy, s / 3, "F");
        }
      }
    };

    // Draw a star rating (5 stars)
    const drawStars = (x: number, y: number, rating: number, color: number[]) => {
      doc.setFillColor(color[0], color[1], color[2]);
      const r = 4.5;
      for (let i = 0; i < 5; i++) {
        const cx = x + i * 12;
        if (i < Math.round(rating)) {
          // filled diamond as star approximation
          doc.triangle(cx, y - r, cx - r, y + r / 2, cx + r, y + r / 2, "F");
          doc.triangle(cx, y + r, cx - r, y - r / 2, cx + r, y - r / 2, "F");
        } else {
          doc.setDrawColor(color[0], color[1], color[2]);
          doc.setLineWidth(0.6);
          doc.circle(cx, y, 2.5);
        }
      }
    };

    // ============ COVER ============
    doc.setFillColor(8, 15, 40);
    doc.rect(0, 0, pageW, pageH, "F");
    // decorative diagonal stripes
    doc.setFillColor(37, 99, 235);
    for (let i = -2; i < 10; i++) {
      doc.triangle(i * 80, 0, i * 80 + 60, 0, i * 80, 60, "F");
    }
    doc.setFillColor(251, 191, 36);
    doc.rect(40, pageH / 2 - 90, 6, 60, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(42);
    doc.text("Catálogo de", 60, pageH / 2 - 40);
    doc.text("Parceiros", 60, pageH / 2 + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(191, 219, 254);
    doc.text("MV BROKER CONNECT", 60, pageH / 2 + 40);
    doc.text("Rede de profissionais de confiança", 60, pageH / 2 + 58);
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).toUpperCase(), 60, pageH - 60);

    // ============ SUMMARY ============
    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, pageH, "F");
    doc.setFillColor(15, 27, 61);
    doc.rect(0, 0, pageW, 90, "F");
    doc.setFillColor(251, 191, 36);
    doc.rect(40, 30, 4, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Sumário", 56, 60);
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    let sy = 130;
    allGrouped.forEach(([cat, list], i) => {
      const [p1, , acc] = colorsFor(cat);
      doc.setFillColor(p1[0], p1[1], p1[2]);
      doc.circle(56, sy - 4, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(String(i + 1).padStart(2, "0"), 56, sy - 1, { align: "center" });
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(cat, 78, sy);
      // dots
      doc.setDrawColor(200, 200, 200);
      doc.setLineDashPattern([1, 3], 0);
      doc.line(78 + doc.getTextWidth(cat) + 10, sy - 3, pageW - 110, sy - 3);
      doc.setLineDashPattern([], 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`${list.length} ${list.length === 1 ? "profissional" : "profissionais"}`, pageW - 50, sy, { align: "right" });
      doc.setFillColor(acc[0], acc[1], acc[2]);
      doc.rect(pageW - 50, sy + 2, 10, 2, "F");
      sy += 26;
    });

    // ============ CATEGORY COVER + LIST ============
    allGrouped.forEach(([cat, list], idx) => {
      const [p1, p2, acc] = colorsFor(cat);

      // ---- COVER PAGE ----
      doc.addPage();
      doc.setFillColor(p1[0], p1[1], p1[2]);
      doc.rect(0, 0, pageW, pageH, "F");
      // gradient feel via stacked rects
      for (let i = 0; i < 20; i++) {
        const t = i / 20;
        const r = p1[0] + (p2[0] - p1[0]) * t;
        const g = p1[1] + (p2[1] - p1[1]) * t;
        const b = p1[2] + (p2[2] - p1[2]) * t;
        doc.setFillColor(r, g, b);
        doc.rect(0, (pageH / 20) * i, pageW, pageH / 20 + 1, "F");
      }
      // dotted pattern overlay
      doc.setFillColor(255, 255, 255);
      for (let x = 30; x < pageW; x += 22) {
        for (let y = 30; y < pageH; y += 22) {
          doc.circle(x, y, 0.6, "F");
        }
      }
      // accent corner
      doc.setFillColor(acc[0], acc[1], acc[2]);
      doc.triangle(0, 0, 140, 0, 0, 140, "F");
      doc.setFillColor(p1[0], p1[1], p1[2]);
      doc.setTextColor(p1[0], p1[1], p1[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(38);
      doc.text(String(idx + 1).padStart(2, "0"), 30, 80);

      // central art panel
      doc.setFillColor(255, 255, 255, );
      const panelW = 280, panelH = 280;
      const panelX = (pageW - panelW) / 2;
      const panelY = pageH / 2 - panelH / 2 - 30;
      // soft border
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(1.5);
      doc.roundedRect(panelX, panelY, panelW, panelH, 16, 16, "S");
      drawArt(cat, pageW / 2, panelY + panelH / 2, 180, acc);

      // title
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(36);
      doc.text(cat.toUpperCase(), pageW / 2, panelY + panelH + 60, { align: "center" });
      doc.setFillColor(acc[0], acc[1], acc[2]);
      doc.rect(pageW / 2 - 30, panelY + panelH + 72, 60, 3, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(219, 234, 254);
      doc.text(`${list.length} ${list.length === 1 ? "profissional cadastrado" : "profissionais cadastrados"}`, pageW / 2, panelY + panelH + 100, { align: "center" });

      // ---- LIST PAGE ----
      doc.addPage();
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageW, pageH, "F");
      // header band
      doc.setFillColor(p1[0], p1[1], p1[2]);
      doc.rect(0, 0, pageW, 80, "F");
      doc.setFillColor(acc[0], acc[1], acc[2]);
      doc.rect(0, 80, pageW, 4, "F");
      // small icon in header
      drawArt(cat, 50, 40, 38, acc);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text(cat, 90, 40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(191, 219, 254);
      doc.text(`Seção ${String(idx + 1).padStart(2, "0")}  •  ${list.length} ${list.length === 1 ? "profissional" : "profissionais"}`, 90, 58);

      autoTable(doc, {
        startY: 110,
        head: [["#", "Profissional", "Cidade", "Contato", "Avaliação"]],
        body: list.map((p, i) => [
          String(i + 1).padStart(2, "0"),
          p.name,
          p.city || "—",
          p.phone || "—",
          "", // rendered via didDrawCell
        ]),
        styles: { font: "helvetica", fontSize: 10, cellPadding: 10, valign: "middle", lineColor: [230, 235, 245], lineWidth: 0.5 },
        headStyles: { fillColor: p1 as any, textColor: 255, fontStyle: "bold", fontSize: 10, halign: "left" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 36, halign: "center", fontStyle: "bold", textColor: p2 as any },
          1: { cellWidth: 170, fontStyle: "bold" },
          2: { cellWidth: 100 },
          3: { cellWidth: 110 },
          4: { cellWidth: 100, halign: "left" },
        },
        margin: { left: 40, right: 40 },
        didDrawCell: (data) => {
          if (data.section === "body" && data.column.index === 4) {
            const p = list[data.row.index];
            const rating = Number(p.rating || 0);
            const cellX = data.cell.x + 6;
            const cellY = data.cell.y + data.cell.height / 2;
            if (rating > 0) {
              drawStars(cellX, cellY - 2, rating, acc);
              doc.setFont("helvetica", "bold");
              doc.setFontSize(9);
              doc.setTextColor(60, 60, 60);
              doc.text(`${rating.toFixed(1)}  (${p.total_ratings || 0})`, cellX, cellY + 10);
            } else {
              doc.setFont("helvetica", "italic");
              doc.setFontSize(9);
              doc.setTextColor(150, 150, 150);
              doc.text("Sem avaliação", cellX, cellY + 2);
            }
          }
        },
      });
    });

    // Footer
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      if (i === 1) continue; // skip cover footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont("helvetica", "normal");
      doc.text("MV BROKER CONNECT  •  Catálogo de Parceiros", 40, pageH - 20);
      doc.text(`${i} / ${total}`, pageW - 40, pageH - 20, { align: "right" });
    }

    doc.save(`parceiros-${new Date().toISOString().slice(0, 10)}.pdf`);
  };


  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="mb-4"><BackButton /></div>
          <div className="flex items-center gap-4 mb-2">
            <img src={logoMvBroker} alt="MV BROKER CONNECT" className="h-16 w-16 object-contain rounded-lg bg-white p-1" />
            <div>
              <div className="flex items-center gap-3">
                <Handshake className="w-7 h-7 text-blue-300" />
                <h1 className="text-3xl font-extrabold">Parceiros</h1>
              </div>
              <p className="text-blue-300 text-sm mt-1">Empresas e profissionais que fazem parte da nossa rede de confiança</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300" />
              <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar parceiro..." className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-300 focus:bg-white/20" />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-blue-300 hover:text-white" />
                </button>
              )}
            </div>
            <button
              onClick={exportPdf}
              disabled={allPartners.length === 0}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white text-blue-950 hover:bg-blue-50 font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown className="w-4 h-4" />
              Exportar PDF
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={cn("px-4 py-2 rounded-full text-sm font-semibold transition-all border",
                activeCategory === cat ? "bg-blue-950 text-white border-blue-950 shadow-md" : "bg-card text-foreground border-border hover:border-blue-400 hover:shadow-sm"
              )}>
              {cat}
            </button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          {filtered.length} {filtered.length === 1 ? "parceiro encontrado" : "parceiros encontrados"}
          {activeCategory !== "Todos" && ` em "${activeCategory}"`}
          {searchTerm && ` para "${searchTerm}"`}
        </p>

        {grouped.length > 0 ? (
          <div className="space-y-10">
            {grouped.map(([category, partners]) => {
              const Icon = categoryIcons[category] || Building2;
              return (
                <section key={category}>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/30">
                      <Icon className="w-4.5 h-4.5" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-lg font-extrabold bg-gradient-to-r from-blue-800 via-blue-600 to-blue-500 bg-clip-text text-transparent tracking-tight">
                      {category}
                    </h2>
                    <span className="text-xs text-muted-foreground ml-1">({partners.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {partners.map(partner => (
                      <Link key={partner.id} to={`/parceiro/${partner.slug}`}
                        className="bg-card rounded-xl border border-border shadow-sm hover:shadow-lg hover:border-blue-400 transition-all group overflow-hidden">
                        <div className="h-36 overflow-hidden">
                          <img src={partner.logo_url || "/placeholder.svg"} alt={partner.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-foreground group-hover:text-blue-700 transition-colors truncate">{partner.name}</h3>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{partner.description}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 transition-colors flex-shrink-0 mt-0.5" />
                          </div>
                          <span className={cn("inline-block mt-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold border", categoryColors[partner.category] || "bg-blue-100 text-blue-800 border-blue-200")}>
                            {partner.category}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Handshake className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum parceiro encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
