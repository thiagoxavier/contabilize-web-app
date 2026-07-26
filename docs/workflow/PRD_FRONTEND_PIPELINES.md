# PRD - Frontend: Interface de Gerenciamento e Renderização de Pipelines no Portal

**Documento de Especificação de Interface, UX/UI e Integração**  
**Versão:** 1.0.0  
**Status:** Proposto  
**Data:** 26/07/2026  

---

## 1. Visão Geral e Objetivos

Este documento especifica os requisitos de Frontend para integrar a interface do Portal do Cliente com a nova API de Pipelines no Backend.

A interface existente em `AberturaEmpresaPage` ([abertura-empresa.jsx](file:///c:/contabilize-seguro/web-app-cliente/src/components/abertura-empresa.jsx)) será aprimorada para:
1. Renderizar dinamicamente as abas de Pipelines com base no retorno da API (`GET /api/pipelines`).
2. Permitir que administradores editem as pipelines diretamente no próprio frontend (gerenciando etapas/colunas do Kanban e passos de checklist padrão).

---

## 2. Experiência do Usuário (UX) & Fluxos de Tela

### 2.1. Navegação Dinâmica de Abas de Pipelines
- Na barra de abas superior de `AberturaEmpresaPage`:
  - Em vez de ler a constante local estática `PIPELINES`, o componente busca as pipelines ativas via `GET /api/pipelines`.
  - As abas exibem o nome retornado pela API (ex: "Abertura de empresa", "Cliente com empresa (transferência)", ou novas pipelines criadas).

### 2.2. Botão de Configuração de Pipelines (Acesso Administrativo)
- No cabeçalho da página (lado direito do botão "+ Nova Empresa"), para usuários com permissão de administrador:
  - Adiciona-se o botão **"Gerenciar Pipelines"** (ícone de engrenagem).
  - Ao clicar, abre o **Modal de Edição de Pipelines**.

### 2.3. Modal de Gerenciamento e Alteração de Pipelines (`ModalGerenciarPipelines`)
O modal permite ao administrador customizar totalmente os fluxos existentes ou criar novos pipelines:
- **Aba 1: Lista de Pipelines**:
  - Exibe os pipelines existentes ("Abertura de empresa", "Transferência", etc.).
  - Botão "+ Novo Pipeline".
  - Opção para editar nome, descrição e ordem de exibição.
- **Aba 2: Configuração de Colunas / Etapas**:
  - Seleção do pipeline a editar.
  - Lista das colunas (Etapas) em ordem.
  - Opção para reordenar colunas (botões Subir/Descer ou Drag & Drop).
  - Editar rótulo e hint de cada coluna.
  - Botão "+ Nova Coluna".
- **Aba 3: Checklist de Passos Padrão**:
  - Para cada coluna/etapa selecionada, exibe a lista de passos padrão (itens do checklist).
  - Adição, edição e remoção de passos padrão.

---

## 3. Mapeamento de Arquivos e Serviços Frontend

### 3.1. Novo Cliente de API (`src/utils/pipelinesApi.js`)
Serviço para consumir os novos endpoints do backend:
- `listarPipelines()`: `GET /api/pipelines`
- `criarPipeline(dto)`: `POST /api/pipelines`
- `atualizarPipeline(id, dto)`: `PUT /api/pipelines/${id}`
- `deletarPipeline(id)`: `DELETE /api/pipelines/${id}`
- `criarEtapaPipeline(pipelineId, dto)`: `POST /api/pipelines/${pipelineId}/etapas`
- `atualizarEtapaPipeline(etapaId, dto)`: `PUT /api/pipelines/etapas/${etapaId}`
- `deletarEtapaPipeline(etapaId)`: `DELETE /api/pipelines/etapas/${etapaId}`
- `reordenarEtapasPipeline(pipelineId, dto)`: `PUT /api/pipelines/${pipelineId}/etapas/ordem`
- `criarPassoPipeline(etapaId, dto)`: `POST /api/pipelines/etapas/${etapaId}/passos`
- `atualizarPassoPipeline(passoId, dto)`: `PUT /api/pipelines/passos/${passoId}`
- `deletarPassoPipeline(passoId)`: `DELETE /api/pipelines/passos/${passoId}`

### 3.2. Atualização de Componentes UI
- **[abertura-empresa.jsx](file:///c:/contabilize-seguro/web-app-cliente/src/components/abertura-empresa.jsx)**:
  - Adição do componente `ModalGerenciarPipelines`.
  - Integração da seleção de pipeline ao cadastrar nova empresa (menu dropdown no `ModalNovaEmpresa`).
  - Carregamento de colunas e cartões alinhados à pipeline selecionada na aba ativa.

---

## 4. Critérios de Aceite

1. **Renderização de Abas**: As abas no topo da tela de Abertura de Empresa devem refletir fielmente os pipelines cadastrados no backend.
2. **Edição no Próprio Front**: Administradores conseguem adicionar/editar colunas e passos de checklist via modal de configuração.
3. **Persistência ao Criar Empresa**: Ao cadastrar uma nova empresa associada a um pipeline, suas etapas e checklist são automaticamente clonados a partir da configuração do pipeline no servidor.
4. **Preservação Visual (DS)**: O estilo visual deve seguir estritamente o Design System existente (`.ae-*` CSS classes, avatares, tags de status e modais).
