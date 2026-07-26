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
