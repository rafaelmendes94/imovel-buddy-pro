/**
 * Modelos (templates), formatos e campos disponíveis no Gerador de Tabela de Imóveis.
 * Somente definições visuais/estruturais — nenhum dado é alterado.
 */

export type TemplateId = "classico" | "premium-escuro" | "clean" | "cards";

export interface TemplateDef {
  id: TemplateId;
  name: string;
  description: string;
  layout: "rows" | "cards";
  itemsPerPage: { landscape: number; portrait: number };
  colors: {
    pageBg: string;
    headerBg: string;
    headerText: string;
    text: string;
    muted: string;
    accent: string;
    rowBg: string;
    rowAltBg: string;
    border: string;
    priceText: string;
  };
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: "classico",
    name: "Clássico Premium",
    description: "Fundo branco, cabeçalho azul marinho e detalhes dourados.",
    layout: "rows",
    itemsPerPage: { landscape: 5, portrait: 7 },
    colors: {
      pageBg: "#ffffff",
      headerBg: "#071D3B",
      headerText: "#ffffff",
      text: "#0B1B33",
      muted: "#5A6A80",
      accent: "#C8A24A",
      rowBg: "#ffffff",
      rowAltBg: "#F5F7FA",
      border: "#E1E7EF",
      priceText: "#071D3B",
    },
  },
  {
    id: "premium-escuro",
    name: "Premium Escuro",
    description: "Fundo azul muito escuro, detalhes dourados e imagens maiores.",
    layout: "rows",
    itemsPerPage: { landscape: 4, portrait: 5 },
    colors: {
      pageBg: "#050B18",
      headerBg: "#0A1428",
      headerText: "#F5E6C3",
      text: "#F2F5F9",
      muted: "#9AA8BD",
      accent: "#C8A24A",
      rowBg: "#0C1526",
      rowAltBg: "#111C31",
      border: "#22304A",
      priceText: "#E7C97B",
    },
  },
  {
    id: "clean",
    name: "Clean Minimalista",
    description: "Fundo branco, azul e linhas suaves. Visual corporativo.",
    layout: "rows",
    itemsPerPage: { landscape: 6, portrait: 8 },
    colors: {
      pageBg: "#ffffff",
      headerBg: "#ffffff",
      headerText: "#0B5ED7",
      text: "#16233A",
      muted: "#6B7A90",
      accent: "#0B5ED7",
      rowBg: "#ffffff",
      rowAltBg: "#FAFBFD",
      border: "#EDF1F6",
      priceText: "#0B5ED7",
    },
  },
  {
    id: "cards",
    name: "Cards Modernos",
    description: "Cada imóvel em um card com foto grande e preço destacado.",
    layout: "cards",
    itemsPerPage: { landscape: 3, portrait: 4 },
    colors: {
      pageBg: "#F4F7FB",
      headerBg: "#0B5ED7",
      headerText: "#ffffff",
      text: "#0B1B33",
      muted: "#5A6A80",
      accent: "#0B5ED7",
      rowBg: "#ffffff",
      rowAltBg: "#ffffff",
      border: "#E1E7EF",
      priceText: "#071D3B",
    },
  },
];

export const getTemplate = (id: TemplateId) => TEMPLATES.find(t => t.id === id) || TEMPLATES[0];

export type FormatId = "a4-landscape" | "a4-portrait" | "img-16-9" | "img-4-5" | "img-9-16";

export interface FormatDef {
  id: FormatId;
  name: string;
  /** Largura x altura em px (base de render, 96dpi para A4). */
  width: number;
  height: number;
  orientation: "landscape" | "portrait";
  pdf?: { format: [number, number]; orientation: "landscape" | "portrait" };
}

export const FORMATS: FormatDef[] = [
  { id: "a4-landscape", name: "A4 Horizontal", width: 1123, height: 794, orientation: "landscape", pdf: { format: [297, 210], orientation: "landscape" } },
  { id: "a4-portrait", name: "A4 Vertical", width: 794, height: 1123, orientation: "portrait", pdf: { format: [210, 297], orientation: "portrait" } },
  { id: "img-16-9", name: "Imagem 16:9", width: 1600, height: 900, orientation: "landscape" },
  { id: "img-4-5", name: "Imagem 4:5", width: 1080, height: 1350, orientation: "portrait" },
  { id: "img-9-16", name: "Imagem 9:16", width: 1080, height: 1920, orientation: "portrait" },
];

export const getFormat = (id: FormatId) => FORMATS.find(f => f.id === id) || FORMATS[0];

export type FieldKey =
  | "capa" | "titulo" | "empreendimento" | "unidade" | "box" | "quadra" | "lote"
  | "codigo" | "dormitorios" | "suites" | "banheiros" | "vagas"
  | "areaPrivativa" | "areaTotal" | "terreno" | "mobiliado" | "decorado" | "vistaMar"
  | "caracteristicas" | "valor" | "condicoesPagamento"
  | "endereco" | "cidade" | "bairro"
  | "corretorNome" | "corretorTelefone" | "creci"
  | "linkFotos" | "drive" | "paginaImovel" | "qrcode";

export const FIELDS: { key: FieldKey; label: string; group: string; default: boolean }[] = [
  { key: "capa", label: "Foto capa", group: "Imóvel", default: true },
  { key: "titulo", label: "Nome do imóvel", group: "Imóvel", default: true },
  { key: "empreendimento", label: "Empreendimento", group: "Imóvel", default: true },
  { key: "unidade", label: "Unidade", group: "Imóvel", default: true },
  { key: "box", label: "Box", group: "Imóvel", default: true },
  { key: "quadra", label: "Quadra", group: "Imóvel", default: true },
  { key: "lote", label: "Lote", group: "Imóvel", default: true },
  { key: "codigo", label: "Código MV", group: "Imóvel", default: true },

  { key: "dormitorios", label: "Dormitórios", group: "Características", default: true },
  { key: "suites", label: "Suítes", group: "Características", default: true },
  { key: "banheiros", label: "Banheiros", group: "Características", default: false },
  { key: "vagas", label: "Vagas", group: "Características", default: true },
  { key: "areaPrivativa", label: "Área privativa", group: "Características", default: true },
  { key: "areaTotal", label: "Área total", group: "Características", default: false },
  { key: "terreno", label: "Terreno", group: "Características", default: false },
  { key: "mobiliado", label: "Mobiliado", group: "Características", default: true },
  { key: "decorado", label: "Decorado", group: "Características", default: true },
  { key: "vistaMar", label: "Vista para o mar", group: "Características", default: true },
  { key: "caracteristicas", label: "Características", group: "Características", default: true },

  { key: "valor", label: "Valor", group: "Comercial", default: true },
  { key: "condicoesPagamento", label: "Condições de pagamento", group: "Comercial", default: true },

  { key: "endereco", label: "Endereço", group: "Localização", default: false },
  { key: "cidade", label: "Cidade", group: "Localização", default: true },
  { key: "bairro", label: "Bairro", group: "Localização", default: true },

  { key: "corretorNome", label: "Corretor responsável", group: "Corretor", default: true },
  { key: "corretorTelefone", label: "Telefone do corretor", group: "Corretor", default: true },
  { key: "creci", label: "CRECI", group: "Corretor", default: true },

  { key: "linkFotos", label: "Link de fotos", group: "Links", default: true },
  { key: "drive", label: "Google Drive", group: "Links", default: true },
  { key: "paginaImovel", label: "Página do imóvel", group: "Links", default: true },
  { key: "qrcode", label: "QR Code", group: "Links", default: false },
];

export type FieldMap = Record<FieldKey, boolean>;

export const defaultFields = (): FieldMap =>
  FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: f.default }), {} as FieldMap);

export type QrTarget = "pagina" | "drive" | "galeria";
export type BrokerMode = "responsavel" | "outro" | "nenhum";

export interface TableSettingsState {
  titulo: string;
  subtitulo: string;
  template: TemplateId;
  formato: FormatId;
  fields: FieldMap;
  showLogo: boolean;
  showBroker: boolean;
  brokerMode: BrokerMode;
  brokerId: string | null;
  qrTarget: QrTarget;
  /** Cores ativas da apresentação (paleta). */
  palette: Palette;
  /** Paleta de origem, mantida como referência quando há ajuste manual. */
  paletteBaseId: string;
  /** Descrições editadas manualmente, por id de imóvel. */
  descricoes: Record<string, string>;
}

export const defaultSettings = (): TableSettingsState => ({
  titulo: "EXCLUSIVIDADE DE IMÓVEIS",
  subtitulo: "",
  template: "classico",
  formato: "a4-landscape",
  fields: defaultFields(),
  showLogo: true,
  showBroker: true,
  brokerMode: "responsavel",
  brokerId: null,
  qrTarget: "pagina",
  palette: { ...PALETTES[0] },
  paletteBaseId: PALETTES[0].id,
  descricoes: {},
});

export const TITLE_PRESETS = [
  "EXCLUSIVIDADE DE IMÓVEIS",
  "TABELA DE IMÓVEIS",
  "SELEÇÃO DE IMÓVEIS",
  "OPORTUNIDADES",
  "CARTEIRA EXCLUSIVA",
  "IMÓVEIS SELECIONADOS",
];
