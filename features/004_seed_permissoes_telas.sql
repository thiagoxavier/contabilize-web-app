-- Seed de Permissões Padrão (globais, compartilhadas entre todos os tenants)
-- Idempotente: usa ON CONFLICT para não duplicar

INSERT INTO permissoes (codigo, nome, descricao) VALUES
('visualizar', 'Visualizar', 'Permissão para visualizar dados e telas'),
('criar', 'Criar', 'Permissão para criar novos registros'),
('editar', 'Editar', 'Permissão para editar registros existentes'),
('deletar', 'Deletar', 'Permissão para deletar registros'),
('exportar', 'Exportar', 'Permissão para exportar dados'),
('gerar_relatorios', 'Gerar Relatórios', 'Permissão para gerar relatórios')
ON CONFLICT (codigo) DO NOTHING;

-- Seed de Telas Padrão para o tenant 'contabilize'
-- Assumindo que o tenant foi criado no script 002_seed_tenant_padrao.sql

INSERT INTO telas (tenant_id, codigo, nome, descricao, rota, ativa, ordem, icone)
SELECT
    tenants.id,
    telas_data.codigo,
    telas_data.nome,
    telas_data.descricao,
    telas_data.rota,
    telas_data.ativa,
    telas_data.ordem,
    telas_data.icone
FROM tenants, (
    VALUES
    ('painel_principal', 'Painel Principal', 'Dashboard com resumo geral', '/dashboard', true, 1, 'layout-dashboard'),
    ('geren_seguros', 'Gerenciar Seguros', 'Gerenciar seguradoras e dados de login', '/seguradoras', true, 2, 'shield'),
    ('geren_usuarios', 'Gerenciar Usuários', 'Adicionar, editar e remover usuários', '/usuarios', true, 3, 'users'),
    ('geren_acessos', 'Gerenciar Acessos', 'Configurar permissões e roles', '/acessos', true, 4, 'lock'),
    ('relat_acessos', 'Relatório de Acessos', 'Auditoria e logs de acesso', '/relatorios/acessos', true, 5, 'file-text'),
    ('config_sistema', 'Configurações', 'Configurações gerais do sistema', '/configuracoes', true, 6, 'settings')
) AS telas_data(codigo, nome, descricao, rota, ativa, ordem, icone)
WHERE tenants.subdominio = 'contabilize'
ON CONFLICT (tenant_id, codigo) DO NOTHING;

-- Seed de Roles Padrão para o tenant 'contabilize'

INSERT INTO roles (tenant_id, nome, descricao, nivel_hierarquia, padrao)
SELECT
    tenants.id,
    roles_data.nome,
    roles_data.descricao,
    roles_data.nivel_hierarquia,
    roles_data.padrao
FROM tenants, (
    VALUES
    ('Administrador', 'Acesso total ao sistema', 100, true),
    ('Gerente', 'Gerencia dados e usuários', 50, true),
    ('Operador', 'Visualização e operações básicas', 10, true)
) AS roles_data(nome, descricao, nivel_hierarquia, padrao)
WHERE tenants.subdominio = 'contabilize'
ON CONFLICT (tenant_id, nome) DO NOTHING;

-- Seed de Permissões para cada Role
-- ADMIN: Acesso total a todas as telas com todas as permissões

INSERT INTO roles_permissoes_telas (role_id, tela_id, permissao_id)
SELECT
    r.id,
    t.id,
    p.id
FROM roles r
JOIN tenants ON r.tenant_id = tenants.id
JOIN telas t ON t.tenant_id = tenants.id
CROSS JOIN permissoes p
WHERE tenants.subdominio = 'contabilize'
  AND r.nome = 'Administrador'
  AND t.ativa = true
  AND p.codigo IN ('visualizar', 'criar', 'editar', 'deletar', 'exportar', 'gerar_relatorios')
ON CONFLICT (role_id, tela_id, permissao_id) DO NOTHING;

-- GERENTE: Acesso a painel, seguros, usuários e acessos (mas sem deletar)

INSERT INTO roles_permissoes_telas (role_id, tela_id, permissao_id)
SELECT
    r.id,
    t.id,
    p.id
FROM roles r
JOIN tenants ON r.tenant_id = tenants.id
JOIN telas t ON t.tenant_id = tenants.id
CROSS JOIN permissoes p
WHERE tenants.subdominio = 'contabilize'
  AND r.nome = 'Gerente'
  AND t.ativa = true
  AND t.codigo IN ('painel_principal', 'geren_seguros', 'geren_usuarios', 'relat_acessos')
  AND p.codigo IN ('visualizar', 'criar', 'editar', 'exportar', 'gerar_relatorios')
ON CONFLICT (role_id, tela_id, permissao_id) DO NOTHING;

-- OPERADOR: Acesso apenas ao painel e visualizar seguros

INSERT INTO roles_permissoes_telas (role_id, tela_id, permissao_id)
SELECT
    r.id,
    t.id,
    p.id
FROM roles r
JOIN tenants ON r.tenant_id = tenants.id
JOIN telas t ON t.tenant_id = tenants.id
CROSS JOIN permissoes p
WHERE tenants.subdominio = 'contabilize'
  AND r.nome = 'Operador'
  AND t.ativa = true
  AND t.codigo IN ('painel_principal', 'geren_seguros')
  AND p.codigo IN ('visualizar', 'exportar')
ON CONFLICT (role_id, tela_id, permissao_id) DO NOTHING;

-- Atribuir role de Administrador ao usuário admin (criado no script 003_seed_admin.sql)

INSERT INTO usuarios_roles (usuario_id, role_id, atribuido_em)
SELECT
    u.id,
    r.id,
    CURRENT_TIMESTAMP
FROM usuarios u
JOIN roles r ON r.tenant_id = u.tenant_id
JOIN tenants ON tenants.id = u.tenant_id
WHERE u.email = 'admin@contabilize.com.br'
  AND r.nome = 'Administrador'
  AND tenants.subdominio = 'contabilize'
ON CONFLICT (usuario_id, role_id) DO NOTHING;
