import { apiRequest } from '../utils/api';

// API_BASE_URL (utils/api.js) já termina em "/api".
const BASE = '/admin/kanban';

// O backend envelopa tudo em ApiResponse { sucesso, dados, erro }.
const dados = (resposta) => resposta?.dados ?? null;
const lista = (resposta) => resposta?.dados ?? [];
const json = (body) => ({ body: JSON.stringify(body) });

export const kanbanService = {
  // === Planos ===
  listarPlanos: async () => lista(await apiRequest(`${BASE}/planos`)),
  obterPlano: async (id) => dados(await apiRequest(`${BASE}/planos/${id}`)),
  criarPlano: async ({ nome, descricao }) =>
    dados(await apiRequest(`${BASE}/planos`, { method: 'POST', ...json({ nome, descricao }) })),
  atualizarPlano: async (id, { nome, descricao }) =>
    dados(await apiRequest(`${BASE}/planos/${id}`, { method: 'PUT', ...json({ nome, descricao }) })),
  deletarPlano: (id) => apiRequest(`${BASE}/planos/${id}`, { method: 'DELETE' }),

  // === Colunas ===
  listarColunas: async (planoId) => lista(await apiRequest(`${BASE}/planos/${planoId}/colunas`)),
  criarColuna: async (planoId, { nome, cor, tipo, limiteCards }) =>
    dados(await apiRequest(`${BASE}/planos/${planoId}/colunas`, { method: 'POST', ...json({ nome, cor, tipo, limiteCards }) })),
  atualizarColuna: async (id, { nome, cor, tipo, limiteCards }) =>
    dados(await apiRequest(`${BASE}/colunas/${id}`, { method: 'PUT', ...json({ nome, cor, tipo, limiteCards }) })),
  deletarColuna: (id) => apiRequest(`${BASE}/colunas/${id}`, { method: 'DELETE' }),

  // === Cards ===
  listarCards: async (colunaId) => lista(await apiRequest(`${BASE}/colunas/${colunaId}/cards`)),
  criarCard: async (colunaId, card) =>
    dados(await apiRequest(`${BASE}/colunas/${colunaId}/cards`, { method: 'POST', ...json(card) })),
  atualizarCard: async (id, card) =>
    dados(await apiRequest(`${BASE}/cards/${id}`, { method: 'PUT', ...json(card) })),
  moverCard: async (cardId, novaColuna) =>
    dados(await apiRequest(`${BASE}/cards/${cardId}/mover`, { method: 'PUT', ...json({ novaColuna }) })),
  deletarCard: (id) => apiRequest(`${BASE}/cards/${id}`, { method: 'DELETE' }),

  // === Mensagens ===
  listarMensagens: async (cardId) => lista(await apiRequest(`${BASE}/cards/${cardId}/mensagens`)),
  criarMensagem: async (cardId, conteudo) =>
    dados(await apiRequest(`${BASE}/cards/${cardId}/mensagens`, { method: 'POST', ...json({ conteudo }) })),
  deletarMensagem: (id) => apiRequest(`${BASE}/mensagens/${id}`, { method: 'DELETE' }),

  // === Minhas Atividades ===
  // Sem assigneeId, o backend filtra pelo usuário autenticado (claim NameIdentifier).
  listarMinhasAtividades: async (assigneeId) =>
    lista(await apiRequest(`${BASE}/minhas-atividades${assigneeId ? `?assigneeId=${assigneeId}` : ''}`)),
};
