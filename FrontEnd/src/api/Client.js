const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let authToken = null;
export function setAuthToken(token) { authToken = token; }

export class ApiRequestError extends Error {
  constructor(message, code, status, extra = {}) {
    super(message);
    this.code = code;
    this.status = status;
    Object.assign(this, extra);
  }
}

export async function apiFetch(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.success === false) {
    // Mirrors the backend's ApiError shape exactly: message, code, and = any extra fields (e.g. transactionCount on a 409) all workout. the round trip so a component can do err.code === 'CATEGORY_HAS_TRANSACTIONS'.
    throw new ApiRequestError(json.message || 'Request failed', json.code, res.status, json);
  }

  return json.data;
}