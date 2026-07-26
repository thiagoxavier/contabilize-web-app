## Context

O portal (`web-app-cliente`) é uma SPA React 19 + Vite. O shell (`src/App.jsx`) gerencia sessão, RBAC por telas (`/ControleAcesso/usuarios/{userId}/telas-acessiveis`) e alterna abas (`senhas`, `clientes`) renderizadas dentro de `.app` (`Sidebar` + `Topbar`). O DS vive em `src/styles.css` (bloco `DS TOKENS`): fonte `Be Vietnam Pro`, primária `--gold #13A170`, escala `--ink-*`, `--paper`, `--rule`, raios `--r-*`, sombras `--shadow-*`.

O fluxo de abertura de empresa existe hoje apenas como protótipo HTML estático (`docs/workflow/prototipo-fluxo-abertura-empresa.html`) com Vanilla JS: board Kanban, colunas (etapas), cards (empresas), abas de pipeline e modal com checklist + navegação de etapa. Esta fase porta esse **layout** para React, mantendo o **DS do projeto**, como fundação para as features de Passos, Chat e Sincronização.

## Goals / Non-Goals

**Goals:**
- Nova aba "Abertura de empresa" integrada ao shell e ao RBAC.
- Board Kanban por pipeline com colunas = etapas e cards = empresas.
- Modal de etapa com checklist e navegação (anterior / concluir e avançar).
- Reaproveitar o layout do protótipo aplicando o DS do projeto (sem paleta nova).

**Non-Goals:**
- Persistência real / chamadas de API novas (dados mock locais nesta fase).
- Passos como entidade de primeira classe com status/responsável próprios (Feature 2).
- Chat por passo (Feature 3) e sincronização por polling (Feature 4).
- Drag-and-drop de cards (a navegação de etapa é via botões do modal, como no protótipo).

## Decisions

- **D1 — Um componente de tela com subcomponentes internos.** Criar `src/components/abertura-empresa.jsx` exportando `AberturaEmpresaPage` e contendo `Board`, `Coluna`, `CardEmpresa` e `ModalEtapaDetalhes`. *Alternativa:* um arquivo por componente. *Por quê:* segue o padrão do repositório (`senhas.jsx`, `clientes.jsx` concentram tela + modais em um arquivo).

- **D2 — Estado local com `useState` na página.** `activeTab` (pipeline), `selectedId` (empresa aberta) e `clients` (mock com `checked[]`) vivem na página, espelhando o `state` do protótipo. *Alternativa:* Context. *Por quê:* sem persistência nesta fase; Context de Passos entra na Feature 1.

- **D3 — Dados mock em módulo dedicado.** Portar `PIPELINES` e `INITIAL_CLIENTS` do protótipo para `src/data.js` (ou `src/data/abertura.js`). *Por quê:* isola o mock e facilita substituir por API nas próximas features.

- **D4 — Layout do protótipo, tokens do projeto.** Reescrever o CSS do protótipo em `src/styles.css` sob um namespace (ex.: prefixo `.ae-`) aplicando o mapa de conversão da Diretriz de UI: `Roboto`→`Be Vietnam Pro`, `--blue-*`→`--gold`/`--gold-deep`, `--grey-*`/`--navy-*`→`--ink-*`/`--paper`/`--rule`/`--muted`, `--radius-*`→`--r-*`, `--shadow-*`→`--shadow-*`. *Por quê:* diretriz explícita do stakeholder; evita fork de design system.

- **D5 — Integração no shell via RBAC.** Adicionar `abertura` como valor de `activeTab` em `App.jsx`, item na `Sidebar` e crumbs no `Topbar`, exibido conforme o código de tela `abertura_empresa`. *Por quê:* consistente com `senhas`/`clientes`.

- **D6 — Sanitização.** Reusar `escapeHtml` (já presente no protótipo) ou renderização React nativa (que já escapa) para nomes/labels vindos dos dados. *Por quê:* prevenção de XSS mantida ao migrar.

## Risks / Trade-offs

- **Divergência de terminologia (protótipo × design doc)** → No protótipo, checklist = passos. Documentado na Diretriz de UI; a promoção de "item de checklist" para entidade `Passo` fica explicitamente na Feature 2.
- **Código de tela `abertura_empresa` pode não existir no backend de RBAC ainda** → Confirmar/seed do código; enquanto isso, a aba pode ser habilitada localmente para desenvolvimento. Mitigação registrada em Open Questions.
- **Reescrever CSS do protótipo pode divergir visualmente** → Mitigar validando lado a lado (protótipo vs. tela) e usando apenas tokens do DS.
- **Mock local diverge do shape futuro da API** → Manter os dados mock com nomes de campos próximos aos DTOs previstos no design de Passos para reduzir retrabalho.

## Open Questions

- O código de tela para RBAC será `abertura_empresa` ou outro? Precisa de seed em `features/*.sql`?
- Os dois pipelines (`abertura`, `transferencia`) entram já nesta fase ou só `abertura`? (Padrão assumido: ambos, como no protótipo.)
- Onde colocar os dados mock: estender `src/data.js` ou criar `src/data/abertura.js`? (Padrão assumido: módulo dedicado.)
