const BASE_URL = '/api/v1';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorData: { error?: { message?: string; code?: string } } = {};
    try {
      errorData = await res.json();
    } catch (_e) {
      // JSON parsing failed; use default error message
    }
    const message = errorData?.error?.message ?? `HTTP ${res.status}`;
    const error = new Error(message) as Error & { status: number; code?: string };
    error.status = res.status;
    error.code = errorData?.error?.code;
    throw error;
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  retry = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Auto-refresh on 401
  if (res.status === 401 && retry) {
    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshRes.ok) {
        const data: { accessToken: string } = await refreshRes.json();
        setAccessToken(data.accessToken);
        return request<T>(method, path, body, false);
      }
    } catch (_e) {
      // Refresh failed; fall through to logout
    }
    // Refresh failed
    setAccessToken(null);
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  return handleResponse<T>(res);
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
