export const ACTION_KEYS = ["view", "create", "edit", "delete"] as const;

export type ActionKey = (typeof ACTION_KEYS)[number];
export type ModulePerms = Record<ActionKey, boolean>;
export type PermissionsMap = Record<string, ModulePerms>;

const emptyPerms = (): ModulePerms => ({ view: false, create: false, edit: false, delete: false });

export const ADMIN_PERMISSION_MODULES = [
  { key: "dashboard_admin", label: "Dashboard Admin" },
  { key: "funcionarios", label: "Funcionários" },
  { key: "clientes", label: "Clientes" },
  { key: "planos", label: "Planos" },
  { key: "brick", label: "Brick" },
] as const;

export const OPERATIONAL_PERMISSION_MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "relatorios", label: "Relatórios" },
  { key: "site_editor", label: "Site" },
  { key: "imoveis", label: "Imóveis" },
  { key: "edificios", label: "Edifícios" },
  { key: "condominios", label: "Condomínios" },
  { key: "fotos_cidade", label: "Fotos da Cidade" },
  { key: "avaliacoes", label: "Avaliações" },
  { key: "financeiro", label: "Financeiro" },
  { key: "tabelas", label: "Tabelas" },
  { key: "contratos", label: "Contratos" },
  { key: "material_extra", label: "Material Extra" },
  { key: "corretores", label: "Corretores" },
  { key: "imobiliarias", label: "Imobiliárias" },
  { key: "configuracoes", label: "Configurações" },
] as const;

export const ALL_PERMISSION_MODULES = [
  ...ADMIN_PERMISSION_MODULES,
  ...OPERATIONAL_PERMISSION_MODULES,
] as const;

export const PLAN_MODULES = [
  { key: "imoveis", label: "Imóveis" },
  { key: "edificios", label: "Edifícios" },
  { key: "condominios", label: "Condomínios" },
  { key: "site", label: "Site" },
  { key: "fotos", label: "Fotos da Cidade" },
  { key: "avaliacoes", label: "Avaliações" },
  { key: "financeiro", label: "Financeiro" },
  { key: "tabelas", label: "Tabelas" },
  { key: "contratos", label: "Contratos" },
  { key: "videomaker", label: "Material Extra" },
  { key: "corretores", label: "Corretores" },
  { key: "brick", label: "Brick" },
] as const;

export const buildDefaultPermissions = (): PermissionsMap =>
  Object.fromEntries(ALL_PERMISSION_MODULES.map((mod) => [mod.key, emptyPerms()]));

export const ensureAllPermissions = (perms?: Partial<PermissionsMap> | null): PermissionsMap => {
  const result = buildDefaultPermissions();
  Object.entries(perms || {}).forEach(([key, value]) => {
    result[key] = {
      view: !!value?.view,
      create: !!value?.create,
      edit: !!value?.edit,
      delete: !!value?.delete,
    };
  });
  return result;
};
