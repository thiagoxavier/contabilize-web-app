# PRD - Backend: Datas de Início/Fim e Chat de Timeline nos Pipelines

**Documento de Especificação Técnica e Requisitos**  
**Versão:** 1.0.0  
**Status:** Proposto  
**Data:** 26/07/2026  
**Feature:** Pipeline Datas + Chat de Timeline

---

## 1. Visão Geral e Objetivos

Esta feature estende o módulo de Pipelines para incluir:

1. **Datas de início e fim do pipeline** por empresa — registra quando a empresa entrou no pipeline e quando concluiu.
2. **Datas de início e fim de cada etapa** por empresa — rastreia exatamente quando cada coluna do Kanban foi iniciada e concluída.
3. **Chat de Timeline por pipeline** — um log cronológico de eventos em linguagem natural, permitindo que o usuário registre interações, anotações e marcos durante o processo (ex: "21/06/2026 - Mandei um whats para o cliente, aguardando resposta.").

---

## 2. Modelagem de Banco de Dados

### 2.1. Entidade `EmpresaPipeline` (Tabela: `EmpresaPipelines`)

Representa a **instância de execução de um pipeline por empresa**. Cada empresa pode ter um único pipeline ativo por tipo de fluxo.

| Campo | Tipo | Nulo | Descrição |
|---|---|---|---|
| `Id` | `Guid` | Não | Chave primária |
| `EmpresaId` | `Guid` | Não | FK → `Empresas.Id` |
| `PipelineId` | `Guid` | Não | FK → `Pipelines.Id` (modelo) |
| `DataInicio` | `DATE` | Sim | Data em que o pipeline foi iniciado para esta empresa |
| `DataFim` | `DATE` | Sim | Data em que o pipeline foi concluído para esta empresa |
| `CriadaEm` | `DATETIME` | Não | Data de criação do registro |
| `AtualizadaEm` | `DATETIME` | Não | Data da última alteração |

> **Nota:** Se o sistema ainda utiliza o campo `PipelineId` diretamente na tabela `Empresas`, esta tabela substitui ou complementa essa FK, centralizando controle temporal.

---

### 2.2. Extensão da Entidade `EmpresaEtapa` (Tabela: `EmpresaEtapas`)

As etapas instanciadas por empresa já existem ou serão criadas ao clonar o pipeline. Adicionar campos de data a essa entidade:

| Campo | Tipo | Nulo | Descrição |
|---|---|---|---|
| `Id` | `Guid` | Não | Chave primária |
| `EmpresaId` | `Guid` | Não | FK → `Empresas.Id` |
| `PipelineEtapaId` | `Guid` | Não | FK → `PipelineEtapas.Id` (modelo) |
| `DataInicio` | `DATE` | Sim | Data em que a etapa foi iniciada para esta empresa |
| `DataFim` | `DATE` | Sim | Data em que a etapa foi concluída para esta empresa |
| `CriadaEm` | `DATETIME` | Não | Data de criação |
| `AtualizadaEm` | `DATETIME` | Não | Data da última alteração |

---

### 2.3. Entidade `EmpresaPipelineEvento` (Tabela: `EmpresaPipelineEventos`) — **NOVA**

Representa uma entrada no **chat de timeline** do pipeline de uma empresa.

| Campo | Tipo | Nulo | Descrição |
|---|---|---|---|
| `Id` | `Guid` | Não | Chave primária |
| `EmpresaId` | `Guid` | Não | FK → `Empresas.Id` |
| `PipelineId` | `Guid` | Não | FK → `Pipelines.Id` |
| `DataEvento` | `DATE` | Não | Data do evento registrado pelo usuário (ex: 21/06/2026) |
| `Descricao` | `TEXT` | Não | Descrição textual do evento |
| `AutorId` | `Guid` | Sim | FK → `Usuarios.Id` — usuário que registrou o evento |
| `AutorNome` | `VARCHAR(150)` | Sim | Nome do autor no momento do registro (snapshot para histórico) |
| `CriadaEm` | `DATETIME` | Não | Timestamp de criação (hora exata do registro) |
| `AtualizadaEm` | `DATETIME` | Não | Data da última edição |

---

## 3. DTOs (Data Transfer Objects)

### 3.1. `EmpresaPipelineDto`
```json
{
  "id": "guid",
  "empresaId": "guid",
  "pipelineId": "guid",
  "pipelineNome": "string",
  "dataInicio": "2026-01-15",
  "dataFim": null,
  "etapas": [ "EmpresaEtapaDto[]" ],
  "eventos": [ "EmpresaPipelineEventoDto[]" ]
}
```

### 3.2. `EmpresaEtapaDto`
```json
{
  "id": "guid",
  "pipelineEtapaId": "guid",
  "label": "string",
  "hint": "string",
  "ordem": 1,
  "dataInicio": "2026-01-15",
  "dataFim": null
}
```

### 3.3. `EmpresaPipelineEventoDto`
```json
{
  "id": "guid",
  "empresaId": "guid",
  "pipelineId": "guid",
  "dataEvento": "2026-06-21",
  "descricao": "Mandei um whats para o cliente, aguardando resposta.",
  "autorId": "guid",
  "autorNome": "João Silva",
  "criadaEm": "2026-06-21T14:30:00Z"
}
```

### 3.4. `AtualizarDatasEmpresaPipelineDto`
```json
{
  "dataInicio": "2026-01-15",
  "dataFim": null
}
```

### 3.5. `AtualizarDatasEmpresaEtapaDto`
```json
{
  "dataInicio": "2026-01-15",
  "dataFim": "2026-02-10"
}
```

### 3.6. `CriarEventoDto`
```json
{
  "dataEvento": "2026-06-21",
  "descricao": "Mandei um whats para o cliente, aguardando resposta."
}
```

### 3.7. `AtualizarEventoDto`
```json
{
  "dataEvento": "2026-06-21",
  "descricao": "Texto corrigido do evento."
}
```

---

## 4. Endpoints da API REST

### 4.1. Datas do Pipeline (por Empresa)

#### `GET /api/empresas/{empresaId}/pipeline`
- **Descrição:** Retorna a instância do pipeline da empresa com datas de início/fim, lista de etapas com suas respectivas datas e lista de eventos de timeline.
- **Resposta `200 OK`:** `EmpresaPipelineDto`

#### `PATCH /api/empresas/{empresaId}/pipeline/datas`
- **Descrição:** Atualiza as datas de início e/ou fim do pipeline da empresa.
- **Body:** `AtualizarDatasEmpresaPipelineDto`
- **Resposta `200 OK`:** `EmpresaPipelineDto`

---

### 4.2. Datas das Etapas (por Empresa)

#### `PATCH /api/empresas/{empresaId}/pipeline/etapas/{etapaId}/datas`
- **Descrição:** Atualiza as datas de início e/ou fim de uma etapa específica da empresa.
- **Body:** `AtualizarDatasEmpresaEtapaDto`
- **Resposta `200 OK`:** `EmpresaEtapaDto`

---

### 4.3. Chat de Eventos / Timeline

#### `GET /api/empresas/{empresaId}/pipeline/eventos`
- **Descrição:** Lista todos os eventos da timeline do pipeline de uma empresa, ordenados por `DataEvento DESC` (mais recente primeiro).
- **Query params opcionais:** `pipelineId` (filtra por pipeline específico)
- **Resposta `200 OK`:** `EmpresaPipelineEventoDto[]`

#### `POST /api/empresas/{empresaId}/pipeline/eventos`
- **Descrição:** Registra um novo evento na timeline do pipeline da empresa.
- **Body:** `CriarEventoDto`
- **Resposta `201 Created`:** `EmpresaPipelineEventoDto`

#### `PUT /api/empresas/{empresaId}/pipeline/eventos/{eventoId}`
- **Descrição:** Edita um evento existente. Apenas o autor original ou um administrador pode editar.
- **Body:** `AtualizarEventoDto`
- **Resposta `200 OK`:** `EmpresaPipelineEventoDto`

#### `DELETE /api/empresas/{empresaId}/pipeline/eventos/{eventoId}`
- **Descrição:** Remove um evento da timeline. Apenas o autor original ou um administrador pode excluir.
- **Resposta `204 No Content`**

---

## 5. Migrations do Banco de Dados

### Migration 1: `AddDatasToEmpresaPipelines`
```sql
ALTER TABLE "EmpresaPipelines"
  ADD COLUMN "DataInicio" DATE NULL,
  ADD COLUMN "DataFim"    DATE NULL;
```

### Migration 2: `AddDatasToEmpresaEtapas`
```sql
ALTER TABLE "EmpresaEtapas"
  ADD COLUMN "DataInicio" DATE NULL,
  ADD COLUMN "DataFim"    DATE NULL;
```

### Migration 3: `CreateEmpresaPipelineEventos`
```sql
CREATE TABLE "EmpresaPipelineEventos" (
  "Id"           UUID          NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "EmpresaId"    UUID          NOT NULL REFERENCES "Empresas"("Id") ON DELETE CASCADE,
  "PipelineId"   UUID          NOT NULL REFERENCES "Pipelines"("Id") ON DELETE RESTRICT,
  "DataEvento"   DATE          NOT NULL,
  "Descricao"    TEXT          NOT NULL,
  "AutorId"      UUID          NULL REFERENCES "Usuarios"("Id") ON DELETE SET NULL,
  "AutorNome"    VARCHAR(150)  NULL,
  "CriadaEm"    TIMESTAMP     NOT NULL DEFAULT NOW(),
  "AtualizadaEm" TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX "IX_EmpresaPipelineEventos_EmpresaId_PipelineId"
  ON "EmpresaPipelineEventos" ("EmpresaId", "PipelineId", "DataEvento" DESC);
```

---

## 6. Regras de Negócio e Segurança

### 6.1. Autenticação & Autorização

| Operação | Permissão mínima |
|---|---|
| Ler datas do pipeline / etapas | Usuário autenticado com acesso à empresa |
| Atualizar datas de pipeline / etapas | Usuário autenticado com acesso à empresa |
| Listar eventos da timeline | Usuário autenticado com acesso à empresa |
| Criar evento na timeline | Usuário autenticado com acesso à empresa |
| Editar/excluir evento | Autor do evento **ou** usuário Admin |

### 6.2. Validações

- `DataFim` do pipeline não pode ser anterior a `DataInicio` do pipeline.
- `DataFim` da etapa não pode ser anterior a `DataInicio` da etapa.
- `DataEvento` pode ser retroativa (sem limite mínimo), mas não pode ser futura em mais de 1 dia (tolerância de fuso horário).
- `Descricao` do evento: mínimo 3 caracteres, máximo 2000 caracteres.
- Um evento excluído não pode ser recuperado (hard delete).

### 6.3. Comportamento Automático (Regras de Automação)

- Quando uma empresa é associada ao pipeline pela primeira vez, o campo `DataInicio` de `EmpresaPipeline` é preenchido automaticamente com a data atual (se não informado explicitamente).
- Quando uma empresa é movida para uma nova etapa do Kanban:
  - A etapa de destino tem `DataInicio` preenchida automaticamente (se nula).
  - A etapa de origem tem `DataFim` preenchida automaticamente (se nula).
- Quando o pipeline é marcado como **concluído**, `DataFim` do pipeline é preenchida automaticamente (se nula).

---

## 7. Critérios de Aceite

1. **Datas de Pipeline:** Endpoints `GET /api/empresas/{id}/pipeline` e `PATCH .../pipeline/datas` retornam e atualizam corretamente `DataInicio` e `DataFim`.
2. **Datas de Etapas:** Endpoint `PATCH .../etapas/{etapaId}/datas` atualiza corretamente as datas de cada etapa por empresa.
3. **Timeline CRUD completo:** Todos os 4 endpoints de eventos (GET, POST, PUT, DELETE) funcionam conforme especificado.
4. **Validações ativas:** A API retorna `400 Bad Request` com mensagem descritiva para violações de regras de negócio.
5. **Autorização ativa:** `403 Forbidden` para operações não autorizadas (ex: editar evento de outro usuário sem ser Admin).
6. **Migrations executam sem erros** em ambiente local e de staging (sem dados perdidos).
7. **Performance:** Query de listagem de eventos por empresa retorna em < 100ms para até 10.000 registros.
