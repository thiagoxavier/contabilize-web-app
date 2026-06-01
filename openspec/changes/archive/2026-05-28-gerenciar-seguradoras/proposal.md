## Why

Atualmente, o backend da aplicação já está construído e rodando. Este proposal visa focar estritamente na integração, refinamento e validação do frontend em React/JS para garantir o pleno funcionamento do fluxo de gerenciamento de seguradoras (CRUD, listagem, filtros, e decriptografia de senhas em tempo real via API).

## What Changes

- **Integração com API Existente**: Garantir que as chamadas no componente `senhas.jsx` (como `apiRequest('/seguradoras')`, `apiRequest('/seguradoras/{id}/senha')`, etc.) estejam mapeadas e funcionando corretamente com o backend.
- **Contador Dinâmico na Sidebar**: Atualizar o componente `App.jsx` e `sidebar.jsx` para refletir o número real de seguradoras cadastradas dinamicamente a partir dos dados retornados da API, em vez de ler do mock estático `SEGURADORAS.length`.
- **Refinamento do Indicador de Força de Senha**: Garantir que a validação de força da senha no frontend esteja em sincronia com as regras de complexidade do backend.
- **Polimento Visual e Tratamento de Erros**: Melhorar o tratamento de erros visuais no carregamento de credenciais e no salvamento de formulários.

## Capabilities

### New Capabilities
- `gerenciar-seguradoras-frontend`: Interface e integração do cofre de senhas conectada ao backend, com contadores dinâmicos, listagem paginada, filtros, formulário de cadastro/edição e revelação de senhas segura sob demanda.

### Modified Capabilities

## Impact

- **Frontend (React + Vite)**: Alterações nos arquivos `src/App.jsx` (para controle dinâmico do estado e contador da sidebar) e `src/components/senhas.jsx` (garantindo o funcionamento correto do CRUD, tratamento de erros de API e integridade dos estados).
