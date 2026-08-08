const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let authToken = typeof window !== 'undefined' ? sessionStorage.getItem('authToken') : null;

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
    throw new ApiRequestError(json.message || 'Request failed', json.code, res.status, json);
  }

  return json.data;
}

// Read the token synchronously at module load, not via a useEffect in
// AuthContext. React fires child effects before parent effects, and
// DataProvider is a child of AuthProvider — so if this were only set
// inside AuthContext's useEffect, DataContext's own mount-time fetches
// would run first, with no token, and fail silently. Reading it here
// (plain JS, runs the instant this module is imported, before React
// mounts anything) removes the race entirely.