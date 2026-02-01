export type FetchClientOptions = {
  baseUrl: string;
  getAuthToken?: () => string | null;
};

function createRequestId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createFetchClient({ baseUrl, getAuthToken }: FetchClientOptions) {
  return async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    const authToken = getAuthToken ? getAuthToken() : null;
    const headers = new Headers(init.headers);

    if (authToken) {
      headers.set('authorization', `Bearer ${authToken}`);
    }

    headers.set('x-request-id', createRequestId());

    if (!headers.has('content-type') && init.body) {
      headers.set('content-type', 'application/json');
    }

    const res = await fetch(`${baseUrl}${path}`, { ...init, headers });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    }

    return (await res.json()) as T;
  };
}
