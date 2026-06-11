//const API_BASE_URL = 'https://poc-contabilize-api-client.wcar95.easypanel.host/api';
const API_BASE_URL = 'https://localhost:7027/api';


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
    'Content-Type': 'application/json',
    ...options.headers,
  };

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
      throw new Error('Tivemos um problema na comunicação com o servidor, favor contactar a Contabilize');
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
