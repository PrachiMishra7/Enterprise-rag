export const API_BASE = 'http://localhost:8000';

export async function apiCall(method, endpoint, body = null, isFormData = false, token = null) {
  const authToken = token || localStorage.getItem('enterprise_token');
  const headers = {};
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  if (!isFormData && body) headers['Content-Type'] = 'application/json';

  const options = { method, headers };
  if (body) options.body = isFormData ? body : JSON.stringify(body);

  const res = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await res.json();
  
  if (res.status === 401 && endpoint !== '/auth/login') {
    localStorage.removeItem('enterprise_token');
    localStorage.removeItem('enterprise_user');
  }
  
  if (!res.ok) throw new Error(data.detail || 'API request failed');
  return data;
}

