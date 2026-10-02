export const PARTNER_PLAN_MODULES = [
  { key: "perfil_publico", label: "Perfil público de prestador" },
  { key: "catalogo", label: "Inclusão no catálogo completo" },
  { key: "destaque", label: "Destaque na capa rotativa" },
  { key: "pdf_semanal", label: "Inclusão no PDF semanal" },
];

export function getPartnerPlanFeatures(modules: string[] | null | undefined): string[] {
  const enabled = new Set(Array.isArray(modules) ? modules : []);

  if (enabled.has("destaque")) {
    return [
      "Inclusão no catálogo completo",
      "Capa rotativa na página inicial",
      "Até 10 anunciantes em rotação aleatória",
      "Página pública e contato direto",
    ];
  }

  if (enabled.has("pdf_semanal")) {
    return [
      "Inclusão no catálogo completo",
      "Inclusão no PDF semanal",
      "Envio aos corretores toda quinta-feira",
      "Página pública e contato direto",
    ];
  }

  if (enabled.has("catalogo")) {
    return [
      "Inclusão no catálogo completo",
      "Página pública da empresa",
      "Contato direto com corretores",
    ];
  }

  return [
    "Perfil público de prestador",
    "Divulgação dos seus serviços",
    "Contato direto pelo perfil",
  ];
}
