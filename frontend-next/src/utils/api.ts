export const API_BASE = 'http://localhost:8000';

export async function apiCall(method: string, endpoint: string, body: any = null, isFormData = false, token: string | null = null) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData && body) headers['Content-Type'] = 'application/json';

  const options: RequestInit = { method, headers };
  if (body) options.body = isFormData ? body : JSON.stringify(body);

  const res = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await res.json();
  
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('enterprise_token');
      localStorage.removeItem('enterprise_user');
      window.location.href = '/login';
    }
  }
  
  if (!res.ok) throw new Error(data.detail || 'API request failed');
  return data;
}
