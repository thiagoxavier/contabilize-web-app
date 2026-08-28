/**
 * Tipos do Kanban Multi-Planos (JSDoc — o projeto é JS puro).
 * Nomes em camelCase: é assim que a API (.NET, System.Text.Json) serializa.
 *
 * @typedef {Object} Plano
 * @property {string} id
 * @property {string} nome
 * @property {string | null} descricao
 * @property {string} criadoEm
 * @property {string} criadoPor
 *
 * @typedef {Object} Coluna
 * @property {string} id
 * @property {string} planoId
 * @property {string} nome
 * @property {number} posicao
 * @property {string | null} cor
 * @property {string | null} tipo
 * @property {number | null} limiteCards
 *
 * @typedef {Object} Card
 * @property {string} id
 * @property {string} colunaId
 * @property {string} titulo
 * @property {string | null} descricao
 * @property {'baixa' | 'media' | 'alta'} prioridade
 * @property {string | null} assigneeId
 * @property {string | null} dueDate
 * @property {number} posicao
 * @property {string[]} tags
 *
 * @typedef {Object} Mensagem
 * @property {string} id
 * @property {string} cardId
 * @property {string} usuarioId
 * @property {string} usuarioNome
 * @property {string} conteudo
 * @property {string} criadoEm
 */

export {};
