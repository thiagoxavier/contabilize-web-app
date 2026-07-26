import { apiRequest } from './api';

export const pipelinesApi = {
  listarPipelines: () => {
    return apiRequest('/pipelines');
  },

  criarPipeline: (dto) => {
    return apiRequest('/pipelines', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  atualizarPipeline: (id, dto) => {
    return apiRequest(`/pipelines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  deletarPipeline: (id) => {
    return apiRequest(`/pipelines/${id}`, {
      method: 'DELETE',
    });
  },

  criarEtapaPipeline: (pipelineId, dto) => {
    return apiRequest(`/pipelines/${pipelineId}/etapas`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  atualizarEtapaPipeline: (etapaId, dto) => {
    return apiRequest(`/pipelines/etapas/${etapaId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  deletarEtapaPipeline: (etapaId) => {
    return apiRequest(`/pipelines/etapas/${etapaId}`, {
      method: 'DELETE',
    });
  },

  reordenarEtapasPipeline: (pipelineId, dto) => {
    return apiRequest(`/pipelines/${pipelineId}/etapas/ordem`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  criarPassoPipeline: (etapaId, dto) => {
    return apiRequest(`/pipelines/etapas/${etapaId}/passos`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  atualizarPassoPipeline: (passoId, dto) => {
    return apiRequest(`/pipelines/passos/${passoId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  deletarPassoPipeline: (passoId) => {
    return apiRequest(`/pipelines/passos/${passoId}`, {
      method: 'DELETE',
    });
  },

  // === Datas de Pipeline por Empresa ===
  buscarEmpresaPipeline: (empresaId) => {
    return apiRequest(`/empresas/${empresaId}/pipeline`);
  },

  atualizarDatasEmpresaPipeline: (empresaId, dto) => {
    return apiRequest(`/empresas/${empresaId}/pipeline/datas`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  atualizarDatasEmpresaEtapa: (empresaId, etapaId, dto) => {
    return apiRequest(`/empresas/${empresaId}/pipeline/etapas/${etapaId}/datas`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  // === Timeline / Chat de Eventos ===
  listarEventosPipeline: (empresaId) => {
    return apiRequest(`/empresas/${empresaId}/pipeline/eventos`);
  },

  criarEventoPipeline: (empresaId, dto) => {
    return apiRequest(`/empresas/${empresaId}/pipeline/eventos`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  atualizarEventoPipeline: (empresaId, eventoId, dto) => {
    return apiRequest(`/empresas/${empresaId}/pipeline/eventos/${eventoId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  deletarEventoPipeline: (empresaId, eventoId) => {
    return apiRequest(`/empresas/${empresaId}/pipeline/eventos/${eventoId}`, {
      method: 'DELETE',
    });
  },
};
