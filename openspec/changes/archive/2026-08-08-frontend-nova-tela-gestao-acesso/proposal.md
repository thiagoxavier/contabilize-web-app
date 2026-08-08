## Why

Atualmente, a tela de Gestão de Acesso (`src/components/clientes.jsx`) exibe informações básicas do usuário, sem permitir a inclusão de telefone, cargo/departamento, foto de perfil ou campos customizados específicos por tenant. A alteração visa enriquecer o perfil do usuário e dar flexibilidade para tenants configurarem campos dinâmicos adicionais.

## What Changes

- **Novo Wrapper de API**: Criação do módulo `src/utils/usuariosApi.js` para abstrair chamadas de campos customizados e upload/remoção de foto de perfil.
- **Campos adicionais no UserModal**: Inclusão dos campos Telefone e Cargo/Departamento, área de Foto de perfil com upload/preview e renderização dinâmica da seção "Campos adicionais" conforme definições ativas do tenant.
- **Header Enriquecido no UserModal (Modo Edição)**: Restyle visual do topo do modal no modo de edição com avatar, cargo, telefone, e-mail e status em destaque.
- **Tela/Modal de Administração de Campos Customizados**: Modal administrativo para listar, criar, editar, reordenar e desativar definições de campos customizados do tenant.
- **Tratamento de Erros e Loading**: Feedback visual apropriado (`onToast`, previews e loadings) em falhas de upload ou carregamento de campos.

## Non-Goals (Não-objetivos)

- Não haverá alteração ou inclusão de novas colunas na tabela principal de usuários (`<table className="table">`).
- Não será criado novo RBAC no frontend — continuará utilizando a chave de acesso `geren_usuarios`.
- Não serão incluídas abas de contexto contábil (Documentos, DAS, DRE, Atividades) no modal de Usuário.
- Não haverá inclusão de novas suítes de teste automatizado de UI.

## Capabilities

### New Capabilities
- `gestao-acesso-usuario-campos-adicionais`: Cobre a extensão do perfil de usuário com foto, telefone, cargo e campos customizados dinâmicos, incluindo o header de edição e a tela de administração de definições de campos customizados.

### Modified Capabilities
- Nenhuma alteração em capabilities existentes de specs anteriores.

## Impact

- **Frontend Code**: `src/components/clientes.jsx`, `src/utils/usuariosApi.js` (novo).
- **APIs consumidas**: Endpoints `/campos-customizados`, `/campos-customizados/ordem`, `/usuarios/{id}/foto`.
- **Validação**: Verificação via `npm run lint` e `npm run build`.
