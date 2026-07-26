import { apiRequest } from './api';

// Cliente de API para endpoints de Empresas e Etapas
export const empresasApi = {
  // --- Empresas ---
  listarEmpresas: () => {
    return apiRequest('/empresas');
  },

  obterEmpresa: (id) => {
    return apiRequest(`/empresas/${id}`);
  },

  criarEmpresa: (dto) => {
    return apiRequest('/empresas', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  atualizarEmpresa: (id, dto) => {
    return apiRequest(`/empresas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  deletarEmpresa: (id) => {
    return apiRequest(`/empresas/${id}`, {
      method: 'DELETE',
    });
  },

  // --- Etapas ---
  listarEtapas: (empresaId) => {
    return apiRequest(`/empresas/${empresaId}/etapas`);
  },

  criarEtapa: (empresaId, dto) => {
    return apiRequest(`/empresas/${empresaId}/etapas`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  atualizarEtapa: (etapaId, dto) => {
    return apiRequest(`/etapas/${etapaId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  deletarEtapa: (etapaId) => {
    return apiRequest(`/etapas/${etapaId}`, {
      method: 'DELETE',
    });
  },

  reordenarEtapas: (empresaId, dto) => {
    return apiRequest(`/empresas/${empresaId}/etapas/ordem`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },
};
