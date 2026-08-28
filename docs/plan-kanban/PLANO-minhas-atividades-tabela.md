# Plano — "Minhas Atividades" em formato de tabela com abertura no modal do Kanban

## Contexto

A tela "Minhas Atividades" (`src/pages/admin/kanban/minhas-atividades.jsx`) lista os `Card`s do Kanban Multi-Planos atribuídos ao usuário, agrupados em seções por prazo (Atrasadas / Hoje / Próximas / Sem prazo). Hoje cada atividade é renderizada como um `<div className="ma-item">` com título, descrição, tags, plano/coluna, prazo e uma ação "Mover para" — não há como abrir a atividade para editar; só é possível mover de coluna.

O pedido é: exibir as atividades em formato de **tabela**, com a **data visível**, e permitir **abrir a atividade ao clicar na linha**, reaproveitando a mesma experiência de detalhe usada no Kanban "Planos".

## Classificação

Tarefa de UI (refino, sem mudança de contrato com a API — todos os campos necessários já existem no `Card` retornado por `GET /admin/kanban/minhas-atividades`).

## Definição de pronto

- Cada seção de prazo (Atrasadas/Hoje/Próximas/Sem prazo) é renderizada como uma tabela própria, com coluna de data visível.
- Clicar em qualquer linha abre o mesmo modal (`CardModal`) usado no Kanban "Planos", pré-carregado com os dados daquela atividade.
- Salvar ou excluir no modal atualiza a lista e fecha o modal.
- A ação "Mover para" continua funcionando, sem disparar a abertura do modal ao ser usada.

**Verificação:** `npm run dev`, abrir `/minhas-atividades` com atividades atrasadas/hoje/futuras/sem prazo, clicar em uma linha de cada grupo, editar e salvar, excluir uma atividade, conferir que a lista recarrega corretamente; `npm run lint` limpo.

## Evidência levantada

- `pages/admin/kanban/minhas-atividades.jsx:170-221` — renderização atual em `<div className="ma-item">` por atividade, agrupada em `<section>` por `grupoDe()`; já existem `formatarData`, filtros e o select "Mover para" (`mover()`, linha 79).
- `hooks/useMinhasAtividades.js` — já expõe `atividades`, `colunasPorPlano`, `recarregar`, `moverAtividade`; nenhuma mudança de hook necessária.
- `usuariosApi.listarUsuarios()` já é chamado em `minhas-atividades.jsx:47` e guardado em `usuarios` — é exatamente o prop que `CardModal` espera.
- `components/kanban/KanbanBoard.jsx:45,226-235` — padrão de referência a seguir: `useState(cardAberto)` + `<CardModal card={cardAberto} usuarios=... onSalvo={...} onExcluido={...} onToast={...} onClose={...} />`.
- `components/kanban/CardModal.jsx:6-111` — recebe o objeto `card` já carregado (sem fetch extra), edita `titulo/descricao/prioridade/assigneeId/dueDate/tags`, chama `kanbanService.atualizarCard`/`deletarCard`. **Não tem campo para mudar de coluna** — por isso o "Mover para" da tabela deve ser preservado como ação própria na linha (com `stopPropagation` para não conflitar com o clique de abrir).
- `components/clientes.jsx:245-341` — padrão de tabela já usado no projeto (`className="table"`, `<thead>/<tbody>`), reaproveitável para consistência visual.

## Decisão já confirmada com o usuário

Manter as 4 seções por prazo (Atrasadas/Hoje/Próximas/Sem prazo), cada uma virando sua própria tabela — **não** uma tabela única com coluna "Situação".

## Abordagem

1. Em `minhas-atividades.jsx`, trocar `<div className="ma-lista">...<div className="ma-item">` por `<table className="table">` dentro de cada `<section>`, com colunas: Título, Cliente (tags), Plano → Coluna, Prazo, Prioridade, e uma coluna de ação "Mover para" (mantendo o `<select>` atual, com `onClick={(e) => e.stopPropagation()}` no `<td>` da ação).
2. Cada `<tr>` ganha `onClick={() => setAtividadeAberta(a)}` e um estilo de cursor de clique.
3. Adicionar `const [atividadeAberta, setAtividadeAberta] = useState(null)`, importar `CardModal` de `components/kanban/CardModal.jsx`, e renderizar condicionalmente ao final, seguindo o padrão de `KanbanBoard.jsx:226-235`:
   - `card={atividadeAberta}` — confirmar durante a implementação se o item retornado pelo endpoint agregado tem `id` (necessário para `CardModal` chamar `kanbanService.atualizarCard(card.id, ...)`) ou só `cardId`; se for só `cardId`, mapear ao abrir o modal.
   - `usuarios={usuarios}` (já existe no estado da página).
   - `onSalvo`/`onExcluido`: chamar `recarregar()` e `setAtividadeAberta(null)`.
   - `onToast={onToast}` (já é prop da página).
4. Nenhuma mudança de backend, hook ou service é necessária.

## Alternativas descartadas

- **Tabela única com coluna "Situação"** — descartada pelo usuário, para preservar a organização visual atual em seções.
- **Modal próprio para "Minhas Atividades"** — descartado por duplicar `CardModal` sem necessidade; reaproveitar é mais seguro e é o que foi pedido ("como se estivesse no kanban").
