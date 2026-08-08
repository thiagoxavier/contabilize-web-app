import { apiRequest } from './api';

export const usuariosApi = {
  listarCamposCustomizados: () => apiRequest('/campos-customizados'),
  salvarCampoCustomizado: (dto) => apiRequest('/campos-customizados', { method: 'POST', body: JSON.stringify(dto) }),
  atualizarCampoCustomizado: (id, dto) => apiRequest(`/campos-customizados/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  excluirCampoCustomizado: (id) => apiRequest(`/campos-customizados/${id}`, { method: 'DELETE' }),
  reordenarCamposCustomizados: (idsEmOrdem) => apiRequest('/campos-customizados/ordem', { method: 'PUT', body: JSON.stringify({ idsEmOrdem }) }),

  enviarFotoUsuario: (id, file) => {
    const formData = new FormData();
    formData.append('foto', file);
    return apiRequest(`/usuarios/${id}/foto`, { method: 'POST', body: formData });
  },
  removerFotoUsuario: (id) => apiRequest(`/usuarios/${id}/foto`, { method: 'DELETE' }),
};
