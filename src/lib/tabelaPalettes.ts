/**
 * Paletas de cores do Gerador de Tabela.
 * Paleta = SOMENTE cores. Template = estrutura/layout.
 * Qualquer paleta pode ser combinada com qualquer template.
 */
import type { TemplateDef } from "./tabelaTemplates";

export interface Palette {
  id: string;
  name: string;
  principal: string;
  secundaria: string;
  destaque: string;
  fundo: string;
  texto: string;
}

export const PALETTES: Palette[] = [
  { id: "mv-broker", name: "MV Broker", principal: "#071D3B", secundaria: "#0B5ED7", destaque: "#D6A23A", fundo: "#FFFFFF", texto: "#10233F" },
  { id: "preto-dourado", name: "Preto & Dourado", principal: "#0A0A0A", secundaria: "#1C1C1C", destaque: "#D4A537", fundo: "#111111", texto: "#FFFFFF" },
  { id: "azul-premium", name: "Azul Premium", principal: "#082B55", secundaria: "#1261D8", destaque: "#7AA7F8", fundo: "#F5F8FC", texto: "#10233F" },
  { id: "clean-branco", name: "Clean Branco", principal: "#FFFFFF", secundaria: "#E9EEF5", destaque: "#0B5ED7", fundo: "#FFFFFF", texto: "#132238" },
  { id: "grafite", name: "Grafite", principal: "#20242B", secundaria: "#343A43", destaque: "#C99B3B", fundo: "#F5F5F5", texto: "#161A20" },
  { id: "azul-claro", name: "Azul Claro", principal: "#DCEBFA", secundaria: "#A9CCF2", destaque: "#1769C2", fundo: "#FFFFFF", texto: "#13345B" },
];

export const getPalette = (id: string) => PALETTES.find(p => p.id === id) || PALETTES[0];

/* ------------------------- utilidades de cor ------------------------- */

const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

export const toRgb = (hex: string): [number, number, number] => {
  let h = (hex || "#000000").replace("#", "").trim();
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const n = parseInt(h.slice(0, 6) || "000000", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const toHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map(v => clamp(v).toString(16).padStart(2, "0")).join("");

/** Mistura duas cores (t = 0 → a, t = 1 → b). */
export const mix = (a: string, b: string, t: number) => {
  const [r1, g1, b1] = toRgb(a);
  const [r2, g2, b2] = toRgb(b);
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
};

const channel = (v: number) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

export const luminance = (hex: string) => {
  const [r, g, b] = toRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

export const contrast = (a: string, b: string) => {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

export const isDark = (hex: string) => luminance(hex) < 0.45;

/** Texto legível sobre um fundo qualquer (contraste automático). */
export const readableOn = (bg: string, light = "#FFFFFF", dark = "#101828") =>
  contrast(bg, light) >= contrast(bg, dark) ? light : dark;

/** Garante contraste mínimo do texto escolhido em relação ao fundo. */
const safeText = (text: string, bg: string) => (contrast(text, bg) >= 3.5 ? text : readableOn(bg));

/** Converte uma paleta nas cores estruturais usadas pelo preview/exportação. */
export function paletteColors(p: Palette): TemplateDef["colors"] {
  const darkBg = isDark(p.fundo);
  const text = safeText(p.texto, p.fundo);
  const rowBg = darkBg ? mix(p.fundo, "#FFFFFF", 0.06) : p.fundo;
  const rowAltBg = darkBg ? mix(p.fundo, p.secundaria, 0.55) : mix(p.fundo, p.secundaria, 0.35);
  return {
    pageBg: p.fundo,
    headerBg: p.principal,
    headerText: readableOn(p.principal, "#FFFFFF", safeText(p.texto, p.principal)),
    text,
    muted: mix(text, p.fundo, 0.45),
    accent: safeText(p.destaque, rowBg),
    rowBg,
    rowAltBg,
    border: mix(p.fundo, darkBg ? "#FFFFFF" : "#000000", 0.14),
    priceText: darkBg ? safeText(p.destaque, rowBg) : safeText(p.principal, rowBg),
  };
}

/* ------------------------- minhas paletas ------------------------- */

const LS_KEY = "mv-tabela-paletas";

export const loadMyPalettes = (): Palette[] => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

export const saveMyPalettes = (list: Palette[]) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
};
