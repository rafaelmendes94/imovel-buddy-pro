import { forwardRef, useEffect, useRef, useState } from "react";
import { QRCodeImg } from "./QRCodeImg";
import {
  autoDescription, identityLines, money, photosUrl, propertyPageUrl,
  type TabelaCorretor, type TabelaImovel,
} from "@/lib/tabelaData";
import { getFormat, getTemplate, type TableSettingsState } from "@/lib/tabelaTemplates";
import { isDark, paletteColors } from "@/lib/tabelaPalettes";

interface Props {
  items: TabelaImovel[];
  settings: TableSettingsState;
  corretores: TabelaCorretor[];
  logoUrl?: string | null;
  /** largura disponível para escalar o preview */
  containerWidth?: number;
}

const chunk = <T,>(arr: T[], size: number) => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

/** Páginas renderizadas em tamanho real (escaladas visualmente) — usadas também na exportação. */
export const TablePreview = forwardRef<HTMLDivElement, Props>(function TablePreview(
  { items, settings, corretores, logoUrl, containerWidth },
  ref
) {
  const tpl = getTemplate(settings.template);
  const fmt = getFormat(settings.formato);
  const c = paletteColors(settings.palette);
  const f = settings.fields;
  const perPage = tpl.itemsPerPage[fmt.orientation];
  const pages = chunk(items, perPage);
  const outer = useRef<HTMLDivElement | null>(null);
  const [avail, setAvail] = useState(containerWidth || 0);

  useEffect(() => {
    if (containerWidth) setAvail(containerWidth);
  }, [containerWidth]);

  useEffect(() => {
    const el = outer.current?.parentElement;
    if (!el) return;
    const measure = () => setAvail(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = avail ? Math.min(1, avail / fmt.width) : 1;

  const brokerFor = (p: TabelaImovel): TabelaCorretor | null => {
    if (!settings.showBroker || settings.brokerMode === "nenhum") return null;
    if (settings.brokerMode === "outro") return corretores.find(x => x.id === settings.brokerId) || null;
    const found = corretores.find(x => x.id === p.corretorId);
    if (found) return found;
    return p.corretorNome ? { id: p.id, nome: p.corretorNome, telefone: null, creci: null, foto_url: null } : null;
  };

  const qrUrl = (p: TabelaImovel) => {
    if (settings.qrTarget === "drive") return p.driveUrl || propertyPageUrl(p.id);
    if (settings.qrTarget === "galeria") return photosUrl(p)?.url || propertyPageUrl(p.id);
    return propertyPageUrl(p.id);
  };

  const specs = (p: TabelaImovel) => {
    const out: string[] = [];
    if (f.dormitorios && p.quartos) out.push(`${p.quartos} dorm.`);
    if (f.suites && p.suites) out.push(`${p.suites} suíte${p.suites > 1 ? "s" : ""}`);
    if (f.banheiros && p.banheiros) out.push(`${p.banheiros} banh.`);
    if (f.vagas && p.vagas) out.push(`${p.vagas} vaga${p.vagas > 1 ? "s" : ""}`);
    if (f.areaPrivativa && p.areaPrivativa) out.push(`${p.areaPrivativa} m² priv.`);
    if (f.areaTotal && p.area) out.push(`${p.area} m² totais`);
    return out;
  };

  const identity = (p: TabelaImovel) => {
    const parts = identityLines(p).filter(l => {
      if (l.startsWith("Box") && !f.box) return false;
      if (l.startsWith("Apto") && !f.unidade) return false;
      if (l.startsWith("Q:") && !f.quadra) return false;
      if (l.startsWith("L:") && !f.lote) return false;
      return true;
    });
    return parts;
  };

  const descFor = (p: TabelaImovel) =>
    (settings.descricoes[p.id] ?? autoDescription(p).join("\n")).split("\n").map(s => s.trim()).filter(Boolean);

  const Cover = ({ p, h }: { p: TabelaImovel; h: number }) =>
    !f.capa ? null : (
      <div style={{ width: h * 1.34, height: h, borderRadius: 8, overflow: "hidden", background: c.rowAltBg, border: `1px solid ${c.border}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {p.capa ? (
          <img src={p.capa} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 9, color: c.muted, letterSpacing: 0.5 }}>SEM IMAGEM</span>
        )}
      </div>
    );

  const mixSoft = `${c.accent}22`;

  const LinkChip = ({ url, label }: { url: string; label: string }) => (
    <span
      data-pdf-link={url}
      style={{
        display: "inline-block", padding: "3px 8px", borderRadius: 999, fontSize: 8.5, fontWeight: 700,
        letterSpacing: 0.4,
        color: isDark(c.accent) ? "#ffffff" : c.text,
        background: isDark(c.accent) ? c.accent : mixSoft, border: `1px solid ${c.accent}`,
      }}
    >
      {label}
    </span>
  );

  const linksFor = (p: TabelaImovel) => {
    const out: { url: string; label: string }[] = [];
    const fotos = photosUrl(p);
    if (f.linkFotos && fotos) out.push(fotos);
    if (f.drive && p.driveUrl && !(fotos && fotos.url === p.driveUrl)) out.push({ url: p.driveUrl, label: "GOOGLE DRIVE" });
    if (f.paginaImovel) out.push({ url: propertyPageUrl(p.id), label: "PÁGINA DO IMÓVEL" });
    return out;
  };

  const Row = ({ p, i }: { p: TabelaImovel; i: number }) => {
    const rowH = fmt.orientation === "landscape" ? 96 : 92;
    const broker = brokerFor(p);
    return (
      <div style={{ display: "flex", gap: 12, padding: 10, background: i % 2 ? c.rowAltBg : c.rowBg, border: `1px solid ${c.border}`, borderRadius: 10, alignItems: "stretch" }}>
        <Cover p={p} h={rowH} />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            {f.titulo && <span style={{ fontSize: 13, fontWeight: 800, color: c.text, letterSpacing: 0.2 }}>{p.titulo}</span>}
            {f.codigo && <span style={{ fontSize: 8, fontWeight: 700, color: c.muted }}>{p.code}</span>}
          </div>
          {(f.empreendimento || f.unidade || f.box || f.quadra || f.lote) && identity(p).length > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: c.accent, letterSpacing: 0.3 }}>
              {identity(p).join("  •  ")}
            </span>
          )}
          {(f.cidade || f.bairro || f.endereco) && (
            <span style={{ fontSize: 9.5, color: c.muted }}>
              {[f.endereco ? p.endereco : "", f.bairro ? p.bairro : "", f.cidade ? p.cidade : ""].filter(Boolean).join(", ")}
            </span>
          )}
          {specs(p).length > 0 && (
            <span style={{ fontSize: 9.5, color: c.text, opacity: 0.85 }}>{specs(p).join("  |  ")}</span>
          )}
          {f.caracteristicas && descFor(p).length > 0 && (
            <span style={{ fontSize: 9, color: c.muted, lineHeight: 1.35 }}>{descFor(p).join(" • ")}</span>
          )}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: "auto" }}>
            {linksFor(p).map(l => <LinkChip key={l.label + l.url} {...l} />)}
          </div>
        </div>
        <div style={{ width: 168, display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between", gap: 4 }}>
          {f.valor && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: c.priceText, letterSpacing: 0.2 }}>{money(p.preco)}</div>
              {f.condicoesPagamento && p.condicoesPagamento.length > 0 && (
                <div style={{ fontSize: 8, color: c.muted, maxWidth: 160 }}>{p.condicoesPagamento.join(" • ")}</div>
              )}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            {broker && (
              <div style={{ textAlign: "right", fontSize: 8, color: c.muted, lineHeight: 1.3 }}>
                <div style={{ fontWeight: 700, color: c.text, fontSize: 9 }}>{broker.nome}</div>
                {f.corretorTelefone && broker.telefone && <div>{broker.telefone}</div>}
                {f.creci && broker.creci && <div>CRECI {broker.creci}</div>}
              </div>
            )}
            {f.qrcode && <QRCodeImg value={qrUrl(p)} size={46} dark={c.priceText} />}
          </div>
        </div>
      </div>
    );
  };

  const Card = ({ p }: { p: TabelaImovel }) => {
    const broker = brokerFor(p);
    return (
      <div style={{ background: c.rowBg, border: `1px solid ${c.border}`, borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {f.capa && (
          <div style={{ width: "100%", aspectRatio: "4 / 3", background: c.rowAltBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {p.capa ? (
              <img src={p.capa} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 10, color: c.muted }}>SEM IMAGEM</span>
            )}
          </div>
        )}
        <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
          {f.titulo && <span style={{ fontSize: 12, fontWeight: 800, color: c.text }}>{p.titulo}</span>}
          {identity(p).length > 0 && (
            <span style={{ fontSize: 9.5, fontWeight: 700, color: c.accent }}>{identity(p).join(" • ")}</span>
          )}
          {(f.cidade || f.bairro) && (
            <span style={{ fontSize: 9, color: c.muted }}>{[f.bairro ? p.bairro : "", f.cidade ? p.cidade : ""].filter(Boolean).join(", ")}</span>
          )}
          {specs(p).length > 0 && <span style={{ fontSize: 9, color: c.text, opacity: 0.85 }}>{specs(p).join(" | ")}</span>}
          {f.caracteristicas && descFor(p).length > 0 && (
            <span style={{ fontSize: 8.5, color: c.muted, lineHeight: 1.35 }}>{descFor(p).slice(0, 4).join(" • ")}</span>
          )}
          {f.valor && <div style={{ marginTop: "auto", fontSize: 14, fontWeight: 900, color: c.priceText }}>{money(p.preco)}</div>}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
            {linksFor(p).map(l => <LinkChip key={l.label + l.url} {...l} />)}
            {f.qrcode && <QRCodeImg value={qrUrl(p)} size={38} dark={c.priceText} />}
          </div>
          {broker && (
            <span style={{ fontSize: 8, color: c.muted }}>
              {[broker.nome, f.corretorTelefone ? broker.telefone : "", f.creci && broker.creci ? `CRECI ${broker.creci}` : ""].filter(Boolean).join(" • ")}
            </span>
          )}
        </div>
      </div>
    );
  };

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Selecione imóveis para visualizar a tabela.
      </div>
    );
  }

  return (
    <div
      ref={node => {
        outer.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      style={{ width: fmt.width * scale, height: (fmt.height * scale + 24) * pages.length }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: fmt.width }}>
        {pages.map((pageItems, pi) => (
          <div
            key={pi}
            data-table-page
            style={{
              width: fmt.width, height: fmt.height, background: c.pageBg, color: c.text,
              display: "flex", flexDirection: "column", marginBottom: 24 / scale,
              fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif", overflow: "hidden",
            }}
          >
            {/* Cabeçalho */}
            <div style={{ background: c.headerBg, color: c.headerText, padding: "14px 24px", display: "flex", alignItems: "center", gap: 14, borderBottom: `3px solid ${c.accent}` }}>
              {settings.showLogo && logoUrl && (
                <img src={logoUrl} alt="" crossOrigin="anonymous" style={{ height: 40, objectFit: "contain" }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 1.2 }}>{settings.titulo}</div>
                {settings.subtitulo && (
                  <div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.85 }}>{settings.subtitulo}</div>
                )}
              </div>
              <div style={{ textAlign: "right", fontSize: 9, opacity: 0.8 }}>
                <div>{new Date().toLocaleDateString("pt-BR")}</div>
                <div>{items.length} {items.length === 1 ? "imóvel" : "imóveis"}</div>
              </div>
            </div>

            {/* Conteúdo */}
            <div style={{ flex: 1, padding: "14px 24px", display: tpl.layout === "cards" ? "grid" : "flex", flexDirection: "column", gap: 10, gridTemplateColumns: tpl.layout === "cards" ? `repeat(${fmt.orientation === "landscape" ? 3 : 2}, 1fr)` : undefined, alignContent: "start", overflow: "hidden" }}>
              {pageItems.map((p, i) =>
                tpl.layout === "cards" ? <Card key={p.id} p={p} /> : <Row key={p.id} p={p} i={i} />
              )}
            </div>

            {/* Rodapé */}
            <div style={{ padding: "8px 24px", borderTop: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 8.5, color: c.muted }}>
              <span>MV Broker Connect — valores e disponibilidade sujeitos a alteração sem aviso prévio.</span>
              <span>Página {pi + 1} de {pages.length}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
