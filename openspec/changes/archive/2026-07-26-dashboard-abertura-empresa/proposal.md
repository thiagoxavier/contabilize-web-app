## Why

O acompanhamento da abertura/transferência de empresas hoje existe apenas como protótipo HTML estático (`docs/workflow/prototipo-fluxo-abertura-empresa.html`), fora do app React. Os operadores não têm, dentro do portal, uma visão de quadro (Kanban) das empresas por etapa do processo. Esta mudança traz essa base para o React, servindo de fundação para as features seguintes (Passos, Chat e Sincronização).

## What Changes

- Nova aba/tela **"Abertura de empresa"** dentro do shell existente (`.app` = `Sidebar` + `Topbar`), no mesmo padrão de `senhas` e `clientes`, controlada por RBAC de telas.
- **Board Kanban** com colunas = **Etapas** e cards = **Empresas**, portado do layout do protótipo.
- **Abas de pipeline**: `Abertura de empresa` e `Cliente com empresa (transferência)`, cada uma com seu conjunto de etapas.
- **Card de empresa**: nome, tag de status (Não iniciado / Em andamento / Concluído), avatar do responsável e barra de progresso da etapa.
- **Modal de detalhes da etapa** (`ModalEtapaDetalhes`): responsável, progresso, **checklist da etapa** (marcar/desmarcar itens) e rodapé com navegação de etapa ("Etapa anterior" / "Concluir e avançar").
- **Diretriz de UI**: reaproveitar o **layout** do protótipo, mas aplicar o **design system do projeto** (`src/styles.css` — `Be Vietnam Pro`, `--gold`/`--green`, `--ink-*`, `--paper`, `--rule`, `--r-*`, `--shadow-*`). Nenhum token novo de cor/fonte.
- Dados iniciais **estáticos/locais** (mock em módulo `data`), sem persistência — a persistência de passos vem nas features seguintes.

## Capabilities

### New Capabilities
- `dashboard-abertura-empresa`: Visualização em quadro Kanban das empresas em abertura/transferência, organizadas por pipeline e etapa, com card de progresso e modal de detalhes da etapa (checklist + navegação entre etapas), integrada como nova aba do portal.

### Modified Capabilities
<!-- Nenhuma capability existente tem requisitos alterados. -->

## Impact

- **UI / Frontend**: novos componentes em `src/components/` (ex.: `abertura-empresa.jsx` com board, coluna, card e modal) e dados mock em `src/data.js` (ou módulo dedicado).
- **App shell**: `src/App.jsx` ganha a aba `abertura` (render condicional + crumbs no `Topbar`); `Sidebar` recebe o novo item de navegação.
- **RBAC**: novo código de tela (ex.: `abertura_empresa`) consumido de `/ControleAcesso/usuarios/{userId}/telas-acessiveis` para exibir/ocultar a aba.
- **Estilos**: adições em `src/styles.css` reutilizando os tokens de DS existentes (sem introduzir nova paleta).
- **Sem backend**: esta fase não consome APIs novas; usa dados locais como fundação para as features de Passos/Chat.
