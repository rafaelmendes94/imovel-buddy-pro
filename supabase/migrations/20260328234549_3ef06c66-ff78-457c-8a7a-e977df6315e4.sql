ALTER TABLE staff_permissions 
ADD COLUMN permissions jsonb NOT NULL DEFAULT '{
  "dashboard_admin": {"view":false,"create":false,"edit":false,"delete":false},
  "funcionarios": {"view":false,"create":false,"edit":false,"delete":false},
  "clientes": {"view":false,"create":false,"edit":false,"delete":false},
  "planos": {"view":false,"create":false,"edit":false,"delete":false},
  "dashboard": {"view":false,"create":false,"edit":false,"delete":false},
  "relatorios": {"view":false,"create":false,"edit":false,"delete":false},
  "site_editor": {"view":false,"create":false,"edit":false,"delete":false},
  "imoveis": {"view":false,"create":false,"edit":false,"delete":false},
  "edificios": {"view":false,"create":false,"edit":false,"delete":false},
  "condominios": {"view":false,"create":false,"edit":false,"delete":false},
  "fotos_cidade": {"view":false,"create":false,"edit":false,"delete":false},
  "avaliacoes": {"view":false,"create":false,"edit":false,"delete":false},
  "financeiro": {"view":false,"create":false,"edit":false,"delete":false},
  "tabelas": {"view":false,"create":false,"edit":false,"delete":false},
  "contratos": {"view":false,"create":false,"edit":false,"delete":false},
  "material_extra": {"view":false,"create":false,"edit":false,"delete":false},
  "corretores": {"view":false,"create":false,"edit":false,"delete":false},
  "imobiliarias": {"view":false,"create":false,"edit":false,"delete":false},
  "configuracoes": {"view":false,"create":false,"edit":false,"delete":false}
}'::jsonb;