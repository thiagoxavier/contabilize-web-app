# PRD - Frontend: Ajuste de Datas Apenas na Pipeline e Limpeza de Componentes de Passos/Etapas

**Documento de Especificação Técnica e Requisitos (Frontend)**  
**Versão:** 2.0.0  
**Status:** Proposto  
**Data:** 26/07/2026  
**Feature:** Simplificação do Painel Temporal (Data Apenas na Pipeline) e Remoção de Modais/Datas de Etapas/Passos  
**Autor:** Antigravity AI (via Fable Loop)

---

## 1. Visão Geral e Objetivos

Este PRD estabelece as adequações no frontend (`web-app-cliente`) para se alinhar ao novo modelo de dados centralizado.

### Objetivos:
1. Exibir e gerenciar datas (`dataInicio` e `dataFim`) **exclusivamente no nível do Pipeline** da empresa.
2. Remover controles, inputs e edições de datas em níveis de Etapas ou Passos.
3. Garantir a integridade da UI nos componentes de formulário, Drawer de Detalhes (`EmpresaDetalheDrawer`) e painéis de acompanhamento.

---

## 2. Mudanças nos Componentes Frontend

### 2.1. `PipelineDatasPanel.jsx`
- **Remover** o bloco de código e renderização das etapas (`etapas.map(...)` com inputs de `dataInicio` e `dataFim`).
- **Manter** apenas o card superior com os campos de `Data de Início` e `Data de Término` referentes ao **Pipeline Geral** da empresa.
- **Remover** a função `handleEtapaDate` e chamadas ao endpoint de datas de etapas.

### 2.2. `pipelinesApi.js`
- **Remover** a função `atualizarDatasEmpresaEtapa`.
- **Manter** apenas `atualizarDatasEmpresaPipeline`, `buscarEmpresaPipeline` e as APIs do chat de timeline (`listarEventosPipeline`, `criarEventoPipeline`, etc.).

### 2.3. `EmpresaDetalheDrawer.jsx`
- Exibir no painel lateral o `PipelineDatasPanel` simplificado (contendo apenas as datas do pipeline principal da empresa) + o `PipelineTimelineChat`.
- O checklist de etapas/passos da empresa continuará exibindo apenas o status de conclusão/marcação dos passos (checkbox), sem qualquer input de data por passo/etapa.

### 2.4. `ModalNovaEmpresa` (`abertura-empresa.jsx`)
- Mantém os campos `dataInicio` e `dataFim` no formulário de criação de nova empresa, enviando-os no payload de `POST /api/empresas`.

---

## 3. Fluxo de Dados e Integração API

```
+-------------------------------------------------------+
|                 Modal Nova Empresa                    |
| - Nome, PipelineId, DataInicio, DataFim               |
+---------------------------+---------------------------+
                            | POST /api/empresas
                            v
+-------------------------------------------------------+
|             EmpresaDetalheDrawer (Painel)             |
|                                                       |
|  +-------------------------------------------------+  |
|  | PipelineDatasPanel (Apenas Pipeline)            |  |
|  | - Data de Início do Processo                    |  |
|  | - Data de Término do Processo                   |  |
|  +-------------------------------------------------+  |
|  | PipelineTimelineChat (Eventos / Histórico)      |  |
|  +-------------------------------------------------+  |
+-------------------------------------------------------+
```

---

## 4. Critérios de Aceite Frontend

- [ ] A UI não apresenta mais campos de data de início ou término em etapas ou passos individuais.
- [ ] O componente `PipelineDatasPanel.jsx` renderiza apenas o controle temporal do pipeline geral.
- [ ] O `pipelinesApi.js` não possui referências a endpoints de datas de etapas.
- [ ] A criação de empresa via modal envia corretamente as datas de pipeline para o backend.
- [ ] Nenhuma chamada a endpoints removidos/inexistentes é disparada ao interagir com o Kanban ou Drawer.
