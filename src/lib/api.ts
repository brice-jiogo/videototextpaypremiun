const env = (import.meta as any).env || {};
const API_BASE = env.VITE_API_BASE_URL || '';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    try {
      const json = text ? JSON.parse(text) : {};
      return { ok: res.ok, status: res.status, json };
    } catch (e) {
      return { ok: res.ok, status: res.status, json: { raw: text } };
    }
  } catch (err) {
    return { ok: false, status: 0, json: { error: String(err) } };
  }
}
