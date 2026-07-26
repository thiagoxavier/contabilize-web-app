# PRD - Backend: Gerenciamento e Personalização de Pipelines de Abertura e Transferência

**Documento de Especificação Técnica e Requisitos**  
**Versão:** 1.0.0  
**Status:** Proposto  
**Data:** 26/07/2026  

---

## 1. Visão Geral e Objetivos

Atualmente, a estrutura de etapas e checklist de passos das pipelines ("Abertura de Empresa" e "Cliente com empresa - transferência") estava definida estaticamente no protótipo frontend.

O objetivo desta funcionalidade backend é migrar a definição de Pipelines, Etapas Modelo e Passos Modelo para o banco de dados e expor uma API REST segura e completa no C#/.NET Core (`https://localhost:7027/api`), permitindo que administradores criem, editem, reordenem e desativem pipelines e suas etapas em tempo de execução.

---

## 2. Modelagem de Banco de Dados

### 2.1. Entidade `Pipeline` (Tabela: `Pipelines`)
Representa um fluxo de trabalho completo (ex: "Abertura de empresa", "Transferência de contabilidade").

| Campo | Tipo | Nulo | Descrição |
|---|---|---|---|
| `Id` | `Guid` | Não | Chave primária |
| `Codigo` | `VARCHAR(50)` | Não | Identificador único (ex: `abertura`, `transferencia`) |
| `Nome` | `VARCHAR(100)` | Não | Rótulo de exibição no frontend |
| `Descricao` | `VARCHAR(255)` | Sim | Descrição explicativa do pipeline |
| `Ordem` | `INT` | Não | Ordem de exibição da aba no frontend |
| `Ativo` | `BOOLEAN` | Não | Flag para ativação/desativação |
| `CriadaEm` | `DATETIME` | Não | Data de criação |
| `AtualizadaEm` | `DATETIME` | Não | Data da última alteração |

### 2.2. Entidade `PipelineEtapa` (Tabela: `PipelineEtapas`)
Representa uma coluna do Kanban pertencente a um Pipeline modelo.

| Campo | Tipo | Nulo | Descrição |
|---|---|---|---|
| `Id` | `Guid` | Não | Chave primária |
| `PipelineId` | `Guid` | Não | Chave estrangeira (`Pipelines.Id`) |
| `Label` | `VARCHAR(100)` | Não | Nome da etapa (ex: "Jornada de abertura", "Viabilidade") |
| `Hint` | `VARCHAR(100)` | Sim | Dica/subtítulo da coluna (ex: "Dia 1 ao dia 5") |
| `Ordem` | `INT` | Não | Posicionamento da coluna na esteira |
| `CriadaEm` | `DATETIME` | Não | Data de criação |
| `AtualizadaEm` | `DATETIME` | Não | Data da última alteração |

### 2.3. Entidade `PipelinePasso` (Tabela: `PipelinePassos`)
Representa um item de checklist modelo dentro de uma etapa de um Pipeline.

| Campo | Tipo | Nulo | Descrição |
|---|---|---|---|
| `Id` | `Guid` | Não | Chave primária |
| `PipelineEtapaId` | `Guid` | Não | Chave estrangeira (`PipelineEtapas.Id`) |
| `Titulo` | `VARCHAR(150)` | Não | Descrição do passo (ex: "Envio da jornada") |
| `Descricao` | `TEXT` | Sim | Detalhes adicionais |
| `Ordem` | `INT` | Não | Ordem de exibição dentro da etapa |
| `CriadaEm` | `DATETIME` | Não | Data de criação |
| `AtualizadaEm` | `DATETIME` | Não | Data da última alteração |

### 2.4. Atualização na Entidade `Empresa` (Tabela: `Empresas`)
- Adição da propriedade `PipelineId (Guid)` para indicar a qual pipeline modelo a empresa está associada.

---

## 3. Carga Inicial de Dados (Seed Data Migration)

A migration inicial deve alimentar o banco com as duas pipelines existentes no protótipo:

### Pipeline 1: `abertura` ("Abertura de empresa")
1. **Jornada de abertura**: "Envio da jornada", "Documentos recebidos", "Validação dos documentos".
2. **Viabilidade**: "Nova viabilidade", "Preencher informações do estabelecimento e empresarial", "Transmitir viabilidade", "Salvar protocolo Redesim".
3. **Coletor Nacional (DBE)**: "Informar protocolo", "Dados dos sócios", "Informações complementares", "Transmitir DBE", "Confirmação Receita Federal".
4. **Contrato social**: "Informar protocolo", "Confirmar dados dos sócios e da empresa", "Formular contrato social", "Recolher e pagar a DARE", "Coletar assinatura de documentos e contratos", "Inserir documentos no sistema", "Aguardar aprovação e salvar documentos".
5. **Certificado digital**: "Enviar informações do cliente para Juliana", "Informar cliente sobre horários disponíveis", "Acompanhar agendamento", "Instalar certificado".
6. **Opção pelo Simples**: "Confirmar registro da empresa no Simples Nacional", "Coletar assinaturas".
7. **Inscrição municipal**: "Desbloquear CCM", "Confirmar dados", "Salvar CCM".
8. **Licenciamento**: "Preencher dados", "Responder perguntas sobre licenciamento".
9. **Cadastro SUSEP**: "Acessar SUSEP do corretor", "Preencher dados da empresa".
10. **Finalização**: "Enviar documentos e informações ao cliente", "Onboarding de processos", "Assinatura do contrato".

### Pipeline 2: `transferencia` ("Cliente com empresa (transferência)")
1. **Transferência de contabilidade**: "Assinatura do contrato", "Pedido de transferência para a antiga contabilidade", "Conferir documentação".
2. **Onboarding**: "Iniciar serviços contábeis", "Configurar acessos do cliente".
3. **Notas fiscais** *(Hint: "Dia 1 ao dia 5")*: "Apurar comissões", "Apurar outras receitas", "Emitir NFs", "Importar NFs ao sistema".
4. **DAS** *(Hint: "Dia 10 ao dia 15")*: "Transmitir pelo sistema", "Salvar nos arquivos".
5. **Faturamento anual**: "Apurar faturamento anual", "Salvar nos arquivos".
6. **Controle de pendências**: "Verificar E-CAC", "Verificar DUC", "Verificar DEC".

---

## 4. Endpoints da API REST (OpenAPI / Swagger Spec)

### 4.1. Pipelines CRUD
- `GET /api/pipelines`
  - **Resposta (`200 OK`)**: Array de `PipelineDto` com lista aninhada de `etapas` e `passos`.
- `POST /api/pipelines`
  - **Body**: `CriarPipelineDto` `{ codigo, nome, descricao, ordem }`
  - **Resposta (`201 Created`)**: `PipelineDto`
- `PUT /api/pipelines/{id}`
  - **Body**: `AtualizarPipelineDto` `{ nome, descricao, ordem, ativo }`
  - **Resposta (`200 OK` / `204 No Content`)`
- `DELETE /api/pipelines/{id}`
  - **Resposta (`204 No Content`)`

### 4.2. Etapas do Pipeline
- `POST /api/pipelines/{pipelineId}/etapas`
  - **Body**: `CriarPipelineEtapaDto` `{ label, hint, ordem }`
- `PUT /api/pipelines/etapas/{etapaId}`
  - **Body**: `AtualizarPipelineEtapaDto` `{ label, hint, ordem }`
- `DELETE /api/pipelines/etapas/{etapaId}`
- `PUT /api/pipelines/{pipelineId}/etapas/ordem`
  - **Body**: `ReordenarEtapasPipelineDto` `{ etapasOrdenadasIds: Guid[] }`

### 4.3. Passos do Pipeline
- `POST /api/pipelines/etapas/{etapaId}/passos`
  - **Body**: `CriarPipelinePassoDto` `{ titulo, descricao, ordem }`
- `PUT /api/pipelines/passos/{passoId}`
  - **Body**: `AtualizarPipelinePassoDto` `{ titulo, descricao, ordem }`
- `DELETE /api/pipelines/passos/{passoId}`

### 4.4. Regra de Inicialização de Empresa (`POST /api/empresas`)
Ao criar uma empresa informando o `pipelineId`, a controller/service do backend irá instanciar automaticamente as etapas e passos da empresa com base nos modelos vigentes do pipeline selecionado.

---

## 5. Regras de Negócio e Segurança

1. **Autenticação & Autorização**:
   - Leitura de Pipelines (`GET /api/pipelines`): Qualquer usuário autenticado.
   - Modificação de Pipelines (POST, PUT, DELETE): Restrito a administradores (Role `Admin` / Permissão `geren_config`).
2. **Validações**:
   - Não permitir excluir um Pipeline que contenha empresas ativas sem antes reatribuí-las ou confirmar o arquivamento.
   - O campo `codigo` do pipeline deve ser único.
