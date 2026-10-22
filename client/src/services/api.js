// The only place that talks to the backend: base URL, auth header, common error handling.
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'taskflow_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  register: (b) => request('/auth/register', { method: 'POST', body: b }),
  login: (b) => request('/auth/login', { method: 'POST', body: b }),
  me: () => request('/auth/me'),
  listTasks: ({ page = 1, status = '' } = {}) =>
    request(`/tasks?page=${page}&limit=5${status ? `&status=${status}` : ''}`),
  createTask: (b) => request('/tasks', { method: 'POST', body: b }),
  updateTask: (id, b) => request(`/tasks/${id}`, { method: 'PATCH', body: b }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
};
