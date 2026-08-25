const API_BASE_URL = window.__ENV__?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || (
  import.meta.env.DEV
    ? 'https://localhost:7027/api'
    : 'https://prd-contabilize-api-client-dev.wcar95.easypanel.host/api'
);

export function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('temp_token');
  const headers = {
    ...options.headers,
  };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error) {
    if (error.message === 'Failed to fetch' || error.message?.includes('fetch') || error.name === 'TypeError') {
      throw new Error('Tivemos um problema na comunicação com o servidor, favor contactar a Contabilize', { cause: error });
    }
    throw error;
  }

  if (response.status === 401) {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('temp_token');
    window.location.reload();
    throw new Error('Não autorizado. Sessão expirou.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.erro || errorData.mensagem || 'Erro na requisição.');
  }

  if (response.status === 204) return null;
  return response.json();
}
