import { apiFetch, setAuthToken } from './client.js';

export async function login(email, password) {
  const data = await apiFetch('/api/auth/login', { method: 'POST', body: { email, password } });
  setAuthToken(data.token);
  return data; //this here returns { token, user: { id, email } }
}