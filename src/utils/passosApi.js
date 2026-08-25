import { apiRequest } from './api';

// Cliente de API para endpoints de Passos e Mensagens
export const passosApi = {
  // --- Passos ---
  listarPorEtapa: (etapaId) => {
    return apiRequest(`/etapas/${etapaId}/passos`);
  },

  obterPasso: (passoId) => {
    return apiRequest(`/passos/${passoId}`);
  },

  criarPasso: (dto) => {
    return apiRequest('/passos', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  atualizarPasso: (passoId, dto) => {
    return apiRequest(`/passos/${passoId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  deletarPasso: (passoId) => {
    return apiRequest(`/passos/${passoId}`, {
      method: 'DELETE',
    });
  },

  reordenarPassos: (etapaId, dto) => {
    return apiRequest(`/etapas/${etapaId}/passos/ordem`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  // Board completo de uma empresa (Kanban), com filtros combináveis opcionais
  // (busca em título/descrição, etapa, tag, responsável). "pipelineId" corresponde
  // ao EmpresaId — ver nota de desvio do PRD do Kanban em docs/contexto/CONTRATO-API.md.
  listarPorPipeline: (pipelineId, filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.busca) params.set('busca', filtros.busca);
    if (filtros.etapaId) params.set('etapaId', filtros.etapaId);
    if (filtros.tag) params.set('tag', filtros.tag);
    if (filtros.responsavelId) params.set('responsavelId', filtros.responsavelId);
    const query = params.toString();
    return apiRequest(`/pipelines/${pipelineId}/passos${query ? `?${query}` : ''}`);
  },

  // Move o passo (drag-and-drop) para outra etapa. Síncrono: o chamador deve aguardar
  // a resposta antes de refletir a mudança na UI (PRD do Kanban §5.3/§8).
  moverPasso: (passoId, dto) => {
    return apiRequest(`/passos/${passoId}/mover`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  // --- Mensagens do Passo ---
  listarMensagens: (passoId) => {
    return apiRequest(`/passos/${passoId}/mensagens`);
  },

  criarMensagem: (dto) => {
    return apiRequest('/mensagens-passo', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  atualizarMensagem: (mensagemId, dto) => {
    return apiRequest(`/mensagens-passo/${mensagemId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  deletarMensagem: (mensagemId) => {
    return apiRequest(`/mensagens-passo/${mensagemId}`, {
      method: 'DELETE',
    });
  },
};
