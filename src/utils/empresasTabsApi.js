import { apiRequest } from './api';

export const empresasTabsApi = {
  // Anotações
  listarAnotacoes: (empresaId) => apiRequest(`/Empresas/${empresaId}/anotacoes`).catch(() => []),
  criarAnotacao: (empresaId, texto) => apiRequest(`/Empresas/${empresaId}/anotacoes`, {
    method: 'POST',
    body: JSON.stringify({ texto })
  }),
  
  // Atividades
  listarAtividades: (empresaId) => apiRequest(`/Empresas/${empresaId}/atividades`).catch(() => []),
  criarAtividade: (empresaId, titulo, data, responsavel) => apiRequest(`/Empresas/${empresaId}/atividades`, {
    method: 'POST',
    body: JSON.stringify({ titulo, data, responsavel })
  }),
  toggleAtividade: (empresaId, atividadeId) => apiRequest(`/Empresas/${empresaId}/atividades/${atividadeId}/toggle`, {
    method: 'PUT'
  }),

  // Arquivos / Documentos
  listarArquivos: (empresaId) => apiRequest(`/Empresas/${empresaId}/arquivos`).catch(() => []),
  uploadArquivo: (empresaId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest(`/Empresas/${empresaId}/arquivos`, { method: 'POST', body: formData });
  },

  listarDocumentosContabeis: (empresaId) => apiRequest(`/Empresas/${empresaId}/documentos`).catch(() => []),

  // Emails
  listarEmails: (empresaId) => apiRequest(`/Empresas/${empresaId}/emails`).catch(() => []),
};
