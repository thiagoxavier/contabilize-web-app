## Context

A tela `AberturaEmpresaPage` utiliza dados estáticos locais para simular o progresso das etapas. Para habilitar a colaboração em tempo real e a persistência, precisamos conectar o frontend com as APIs do backend de Passos e Mensagens. Esta especificação de design detalha a infraestrutura de dados (API client e React Context) necessária para dar suporte a essa integração.

## Goals / Non-Goals

**Goals:**
- Criar um cliente de API (`passosApi.js`) para todos os endpoints necessários de passos e mensagens.
- Fornecer um provedor de contexto global (`PassosContext` e `PassosProvider`) para gerenciar o estado centralizado e as ações de CRUD de passos e mensagens.
- Integrar o context na raiz da aplicação React para que qualquer tela ou modal possa consumir os dados.

**Non-Goals:**
- Construir a interface visual (UI) para exibição e edição dos passos e do chat (será abordado nas Features 2 e 3).
- Implementar sincronização periódica/polling em tempo real (será abordado na Feature 4).

## Decisions

### 1. Reuso de Infraestrutura de API Existente
Decidimos importar e reutilizar a função `apiRequest` de `src/utils/api.js` em vez de criar um novo mecanismo de fetch.
- **Razoabilidade**: O `apiRequest` já gerencia a adição automática do token JWT (Bearer Token) nos headers das requisições, faz o tratamento correto do status `401 Unauthorized` (limpando o token e recarregando a página) e lança erros padronizados.

### 2. Estrutura do Estado no React Context
O estado do `PassosContext` será estruturado em dicionários indexados por ID:
- `passos`: `{ [etapaId: string]: Passo[] }`
- `mensagens`: `{ [passoId: string]: Mensagem[] }`
- **Razoabilidade**: Evita a necessidade de percorrer arrays aninhados complexos ao atualizar um único passo ou mensagem. A busca e a atualização direta por chaves de etapa/passo oferecem melhor performance e simplicidade no código do reducer/state.

## Risks / Trade-offs

- **[Risco] Divergência de estado local (Estatalidade)**: Sem polling ativado nesta fase, os dados locais podem ficar desatualizados se outro operador realizar alterações no backend.
  - *Mitigação*: Este comportamento é esperado para a Feature 1 e será completamente mitigado na Feature 4 (Sincronização por Polling).
