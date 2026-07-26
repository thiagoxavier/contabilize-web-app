# Divisão em Features (Frontend) — Passos + Chat por Etapa

**Origem:** [`DESIGN_FEATURE_PASSOS_CHAT.md`](./DESIGN_FEATURE_PASSOS_CHAT.md)
**Data:** 2026-07-16
**Objetivo:** Quebrar a camada de frontend do design em *features* independentes e ordenadas, para gerar um **OpenSpec change por feature**, em sequência (`propose → apply → archive`).

---

## 🧭 Como usar este documento

Cada feature abaixo é um **change do OpenSpec** autocontido. A ordem importa: cada uma assume que a anterior já foi aplicada (`apply`) e arquivada. Para cada feature:

1. Rode a skill de proposta (`/opsx:propose` ou `openspec propose`) usando o bloco da feature como escopo.
2. Nomeie a capability com o **slug sugerido** (kebab-case, padrão do projeto: `gerenciar-seguradoras`, `visualizar-senhas-clientes`).
3. Implemente (`apply`), valide manualmente e arquive antes de seguir para a próxima.

> **Convenção do repositório:** changes ficam em `openspec/changes/AAAA-MM-DD-<slug>/` com `proposal.md`, `tasks.md`, `design.md` e `specs/<capability>/spec.md`. Specs consolidadas em `openspec/specs/<capability>/spec.md`.

---

## 🎨 Diretriz de UI (vale para TODAS as features)

> **Regra:** usar o **layout/estrutura** do protótipo, mas o **design system do projeto atual**. Nenhum token novo de cor/fonte é criado — reaproveita-se o que já existe em `src/styles.css`.

**Layout — de:** [`prototipo-fluxo-abertura-empresa.html`](./prototipo-fluxo-abertura-empresa.html)
Aproveitar a **composição visual** do protótipo: board Kanban com colunas, cards de empresa, abas de pipeline, e o modal (responsável + barra de progresso + checklist + rodapé de navegação de etapa).

**Design system — de:** `src/styles.css` (bloco `DS TOKENS` já existente). **NÃO** copiar os tokens do protótipo.

**Mapa de conversão (protótipo → projeto):**

| No protótipo | Trocar por (token do projeto) |
|---|---|
| Fonte `Roboto` / `--font-brand` | `Be Vietnam Pro` (fonte do `body`) |
| Primária azul `--blue-600 / --blue-700` | `--gold #13A170` / `--gold-deep #0d7050` |
| `--navy-900` (texto forte) | `--ink-900` / `--body` |
| `--grey-600 / --grey-400` (secundário) | `--muted` |
| `--grey-50 / --grey-100` (superfícies) | `--paper` / `--paper-2` |
| `--grey-300 / --grey-200` (bordas) | `--rule` / `--rule-2` |
| `--green-500` (sucesso) | `--green-deep` / `--green` |
| `--red-600` (perigo) | `--danger` |
| `--radius-xs/md/lg` | `--r-sm/md/lg` |
| `--shadow-sm/lg` | `--shadow-sm/md/lg` |
| Tags `tag-info` (azul) | `--gold-tint` + `--gold-deep` |

**Enquadramento no app:** a tela **não** replica o topbar/breadcrumb próprios do protótipo. Ela entra como **nova aba** dentro do shell existente (`.app` = `Sidebar` + `Topbar`), no mesmo padrão de `senhas` e `clientes` (ver `App.jsx` e RBAC por `telas-acessiveis`).

**Reconciliação de terminologia (protótipo × design doc):**

| Protótipo | Design doc / entidade | Papel |
|---|---|---|
| **Coluna** do board | **Etapa** | Fase do processo (Jornada, Viabilidade, …) |
| **Card** do board | **Empresa** | Empresa em abertura/transferência |
| **Item do checklist** | **Passo** | Tarefa dentro da etapa (vira entidade 1ª classe: status/responsável/chat) |
| Abas do topo | **Pipeline** | `Abertura de empresa` / `Cliente com empresa (transferência)` |

> ⚠️ **Divergência de layout do modal:** o modal do protótipo é de **coluna única** (checklist + rodapé "Concluir e avançar"). O design doc assumia dois painéis (Passos à esquerda / Chat à direita). Como a diretriz é "usar o layout do protótipo", o chat da **Feature 3** deve ser integrado **dentro** do layout do protótipo (ex.: expandir o item de passo para revelar o chat), sem recriar um layout de dois painéis. Confirmar o encaixe exato ao propor a Feature 3.

---

## ⚠️ Pré-requisito — Fase 0: Base Kanban em React

O design diz que "evolui o protótipo Kanban existente". **No React (`src/`) essa base ainda não existe** — hoje o app só tem `login`, `senhas`, `clientes`, `sidebar` (ver `README.md`). O Kanban de abertura de empresa está apenas no protótipo HTML (`prototipo-fluxo-abertura-empresa.html`).

Portanto, **antes** das 4 features abaixo é preciso um change de base. Ele **não** faz parte deste design (é a fundação sobre a qual ele evolui), por isso está separado:

| Item | Detalhe |
|---|---|
| **Slug sugerido** | `dashboard-abertura-empresa` |
| **Escopo** | Portar o **layout** do protótipo para React (aplicando o DS do projeto, ver Diretriz de UI): board Kanban com colunas = **Etapas**, cards = **Empresas**, abas de **pipeline** (`Abertura` / `Transferência`), e o **shell** do `ModalEtapaDetalhes` (responsável + progresso + checklist + rodapé de navegação). Entra como **nova aba** no `.app` (Sidebar + Topbar). |
| **Fora do escopo** | Passos como entidade (vira Feature 1/2), Chat e polling (Features 3/4). O checklist do protótipo aqui pode ser estático/local — a persistência real vem nas features seguintes. |
| **Depende de** | — (usa `apiRequest`, `Sidebar`, `Topbar` existentes) |
| **Fonte de layout** | `prototipo-fluxo-abertura-empresa.html` (board, cards, tabs, modal) |

> Se a base já for tratada em outra frente, pule a Fase 0. As features 1–4 assumem que existe um `ModalEtapaDetalhes` onde os passos e o chat serão encaixados.

---

## 🗺️ Visão geral das 4 features

```
Feature 1 ─ Estado & API de Passos  (camada de dados, sem UI)
      │
      ▼
Feature 2 ─ UI de Passos na Etapa   (aba, cards, criar/editar passo)
      │
      ▼
Feature 3 ─ Chat por Passo          (lista + form de mensagens, RBAC, XSS)
      │
      ▼
Feature 4 ─ Sincronização (Polling) (useSincronizacao, otimista, 5–10s)
```

Cada feature é vertical o suficiente para ser demonstrável, mas fina o bastante para um ciclo curto de OpenSpec.

---

## Feature 1 — Estado & API de Passos

| Campo | Valor |
|---|---|
| **Slug (capability)** | `passos-estado-cliente` |
| **Depende de** | Fase 0 (base) |
| **Entrega demonstrável** | Passos de uma etapa carregam via API e ficam disponíveis no contexto (verificável no React DevTools / console). |

**O que inclui**
- Módulo de API (novo `src/utils/passosApi.js` ou extensão de `src/utils/api.js`) cobrindo os endpoints do backend:
  - Passos: `GET /api/passos/etapa/{etapaId}`, `GET /api/passos/{id}`, `POST /api/passos`, `PUT /api/passos/{id}`, `DELETE /api/passos/{id}`.
  - Mensagens: `GET /api/mensagens-passo/{passoId}`, `POST`, `PUT /{id}`, `DELETE /{id}`.
  - Reutiliza `apiRequest` (JWT + interceptador 401 já existentes).
- `PassosContext` + `PassosProvider` + hook `usePassos()` (`src/contexts/PassosContext.jsx`).
- Estado: `passos` (`{ etapaId: [] }`), `mensagens` (`{ passoId: [] }`), `loading`.
- Ações CRUD (`carregarPassos`, `carregarMensagens`, `criarPasso`, `atualizarPasso`, `criarMensagem`, `atualizarMensagem`) — **sem polling ainda**.
- Envolver `App.jsx` com `<PassosProvider>`.

**Fora do escopo:** componentes visuais, polling, chat UI.

**Esboço de tasks**
1. Funções de API de passos e mensagens.
2. `PassosContext` + provider + `usePassos`.
3. Ações CRUD no contexto (estado local mapeado por etapa/passo).
4. Integrar `PassosProvider` em `App.jsx`.

---

## Feature 2 — UI de Passos na Etapa

| Campo | Valor |
|---|---|
| **Slug (capability)** | `visualizar-gerenciar-passos` |
| **Depende de** | Feature 1 |
| **Entrega demonstrável** | Abrir o modal da etapa mostra a grade de passos; dá para criar e editar um passo. |

> **Layout:** reusar o padrão de **checklist da etapa** do protótipo (lista de itens dentro do modal), agora com passos vindos da API. Aplicar tokens do projeto (Diretriz de UI).

**O que inclui**
- `AbaPassos.jsx`: lista de passos no corpo do modal (estilo checklist do protótipo) + estado vazio ("nenhum passo criado").
- `CardPasso.jsx` / item de passo: título, status (0/1/2 → Não iniciado / Em andamento / Concluído via `tag`/checkbox do protótipo), descrição, responsável (`avatar`), **badge com contagem de mensagens**; clicável (seleciona passo).
- Encaixar a lista de passos no `ModalEtapaDetalhes` (shell da Fase 0), mantendo a barra de progresso da etapa (derivada dos status dos passos).
- Formulário de **criar/editar passo** (título, descrição, responsável, status) consumindo as ações da Feature 1.

**Fora do escopo:** chat/mensagens (só a *badge* de contagem), polling.

**Esboço de tasks**
1. `CardPasso` (exibição + seleção + badge de contagem).
2. `AbaPassos` (grade + estado vazio + `carregarPassos` no mount).
3. Integrar `AbaPassos` no `ModalEtapaDetalhes` (painel esquerdo).
4. Form de criar/editar passo ligado ao contexto.
5. Estilização conforme protótipo.

---

## Feature 3 — Chat por Passo

| Campo | Valor |
|---|---|
| **Slug (capability)** | `chat-passo` |
| **Depende de** | Features 1 e 2 |
| **Entrega demonstrável** | Selecionar um passo abre o chat à direita; enviar/editar mensagem funciona; admin vê "deletada". |

> **Layout:** o protótipo não tem chat. Integrar **dentro** do layout dele — ex.: ao selecionar/expandir um passo, revelar o chat abaixo/ao lado do item, sem recriar o modal de dois painéis do design doc. Usar tokens do projeto.

**O que inclui**
- `ChatPasso.jsx`: container do chat do passo selecionado, encadeia lista + form, gerencia submit.
- `ListaMensagens.jsx`: cabeçalho (nome, data, "(editada)"), corpo ou "Mensagem deletada por um administrador"; botão **editar só para o autor** e se não deletada.
- `FormMensagem.jsx`: textarea + botão "Enviar" (desabilitado se vazio/enviando) + feedback de carregamento.
- **RBAC no cliente:** autor edita a própria mensagem; ação de deletar visível só para `Admin` (role do JWT).
- **Sanitização XSS:** `escapeHtml()` ao renderizar o texto das mensagens.

**Fora do escopo:** polling/tempo real (as mensagens só atualizam por ação do usuário nesta feature).

**Esboço de tasks**
1. `FormMensagem` (textarea + submit + estados).
2. `ListaMensagens` (render + "(editada)" + deletada + editar do autor).
3. `ChatPasso` (compõe lista+form no painel direito, ligado ao passo selecionado).
4. `escapeHtml` na renderização + RBAC (autor/admin).
5. Estilização do chat.

---

## Feature 4 — Sincronização por Polling

| Campo | Valor |
|---|---|
| **Slug (capability)** | `sincronizacao-passos-chat` |
| **Depende de** | Features 1, 2 e 3 |
| **Entrega demonstrável** | Com o modal aberto, passos e mensagens atualizam sozinhos a cada 5–10s; edições aparecem otimista antes de confirmar. |

**O que inclui**
- Hook `useSincronizacao(etapaId, passoId, ativo)` (`src/hooks/useSincronizacao.js`).
- `iniciarPolling` / `pararPolling` no `PassosContext` (intervalo 5–10s, cancelável).
- Ciclo de vida: liga ao abrir o modal + selecionar passo; desliga ao fechar/desmontar.
- **Atualização otimista** (edições locais antes de confirmar no servidor) + reconciliação com o retorno do servidor (last-write-wins, ver riscos do design).
- Guarda contra sobreposição de requisições e vazamento de `interval`.

**Fora do escopo:** WebSocket/SSE (explicitamente non-goal do design).

**Esboço de tasks**
1. `iniciarPolling`/`pararPolling` no contexto (com `useCallback` + ref de interval).
2. Hook `useSincronizacao` (efeito com cleanup).
3. Ligar polling ao ciclo do `ModalEtapaDetalhes` (aberto + passo selecionado).
4. Atualização otimista + reconciliação.
5. Testar 2 abas simultâneas (simular 2 operadores) e verificar convergência.

---

## ✅ Checklist de sequenciamento

- [ ] Fase 0 — `dashboard-abertura-empresa` (base, se necessário)
- [ ] Feature 1 — `passos-estado-cliente`
- [ ] Feature 2 — `visualizar-gerenciar-passos`
- [ ] Feature 3 — `chat-passo`
- [ ] Feature 4 — `sincronizacao-passos-chat`

> **Nota sobre o backend:** o design assume os endpoints `api/passos` e `api/mensagens-passo` já disponíveis (Fase 1 do design). As 4 features acima são **frontend**; garanta que o backend correspondente esteja em `dev` antes da Feature 1 (ou use mocks até lá).

---

**Próximo passo sugerido:** rodar `/opsx:propose` para a **Feature 1 (`passos-estado-cliente`)**.
