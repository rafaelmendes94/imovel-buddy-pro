import { describe, expect, it } from "vitest";
import { buildImovelPayload, completeness, dupeKeys, normalizeAiImovel } from "@/lib/pdfTabelaImport";

describe("importação BETA de tabela PDF", () => {
  it("padrão 1: um imóvel por página (Ed. Cacique 39)", () => {
    const n = normalizeAiImovel({
      empreendimento: "Ed. Cacique 39",
      tipo: "Loft",
      bairro: "Centro",
      area_privativa: 33.35,
      preco: 210000,
    });
    expect(n.empreendimento).toBe("Cacique");
    expect(n.unidade).toBe("39");
    expect(n.preco).toBe(210000);
    expect(n.area_privativa).toBeCloseTo(33.35);
    expect(n.status).toBe("Disponível");
  });

  it("padrão 1: dois boxes viram '88 e 89' com 2 vagas", () => {
    const n = normalizeAiImovel({
      empreendimento: "Atl. Green Square",
      unidade: "608B",
      box: "Box 88 + Box 89",
      quartos: 3,
      cidade: "XANGRI-LÁ",
      preco: 1803000,
    });
    expect(n.unidade).toBe("608B");
    expect(n.box).toBe("88 e 89");
    expect(n.vagas).toBe(2);
    expect(n.cidade).toBe("Xangri-lá");
  });

  it("padrão 2: condomínio Q06/L44 não vira unidade", () => {
    const n = normalizeAiImovel({ empreendimento: "Las Palmas", tipo: "Casa", unidade: "Q06/L44", cidade: "Capão da Canoa", preco: 950000 });
    expect(n.unidade).toBe("");
    expect(n.quadra).toBe("06");
    expect(n.lote).toBe("44");
  });

  it("padrão 2: terreno J-09 vira quadra J lote 09", () => {
    const n = normalizeAiImovel({ empreendimento: "Costa Serena", tipo: "Terreno", quadra: "J", lote: "09", preco: 480000, cidade: "Xangri-lá" });
    expect(n.quadra).toBe("J");
    expect(n.lote).toBe("09");
    expect(n.unidade).toBe("");
  });

  it("padrão 2: casa de rua usa número do endereço, não unidade", () => {
    const n = normalizeAiImovel({ tipo: "Casa", endereco: "Rua Begônias", numero: "844", bairro: "Noiva do Mar", preco: 1200000, cidade: "Xangri-lá" });
    expect(n.numero).toBe("844");
    expect(n.unidade).toBe("");
    expect(n.endereco).toBe("Rua Begônias, 844");
  });

  it("padrão 3: cards na mesma página com uma vaga sem número", () => {
    const n = normalizeAiImovel({ empreendimento: "ENZO TOWER", unidade: "806 T1", vagas: 1, preco: 1450000, cidade: "Torres" });
    expect(n.box).toBe("");
    expect(n.vagas).toBe(1);
  });

  it("vendido não entra como disponível", () => {
    const n = normalizeAiImovel({ empreendimento: "EPIC", unidade: "505", preco: 890000, cidade: "Torres", vendido: true });
    expect(n.status).toBe("Vendido");
  });

  it("completude e duplicidade", () => {
    const n = normalizeAiImovel({ empreendimento: "ISLA", unidade: "O-06", tipo: "Lote", cidade: "Xangri-lá", preco: 0 });
    expect(completeness(n).ok).toBe(false);
    expect(completeness(n).missing).toContain("preço");
    const keys = dupeKeys(normalizeAiImovel({ empreendimento: "VIZ", unidade: "L-26", preco: 1, cidade: "Torres" }));
    expect(keys.length).toBeGreaterThan(0);
  });

  it("payload sempre usa o corretor autenticado", () => {
    const p = buildImovelPayload(normalizeAiImovel({ empreendimento: "Sol de Ibiza", unidade: "205", preco: 322000, cidade: "Capão da Canoa" }), "user-1", "Corretor");
    expect(p.user_id).toBe("user-1");
    expect(p.corretor_id).toBe("user-1");
    expect(p.status).toBe("Disponível");
    expect(p.ativo_site).toBe(false);
  });
});
