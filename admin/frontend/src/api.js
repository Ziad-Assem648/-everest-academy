export const BACKEND_URL = window.location.origin.includes("localhost") ? "http://localhost:5000" : "https://steadfast-energy-production-a9d1.up.railway.app";

export function getAdminSession() {
  try { return JSON.parse(localStorage.getItem("admin_session") || "{}"); } catch { return {}; }
}

export function getAdminHeaders() {
  const s = getAdminSession();
  return { "Content-Type": "application/json", "x-user-id": s.userId || "", "x-session-token": s.token || "" };
}

export async function api(path, opts = {}) {
  const headers = { ...getAdminHeaders(), ...(opts.headers || {}) };
  const r = await fetch(path, { headers, ...opts });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = null; }
  if (data && data.session_expired) {
    localStorage.removeItem("admin_session");
    window.location.reload();
    throw new Error("Session expired");
  }
  if (!r.ok) {
    const msg = (data && data.error) ? data.error : `Request failed (${r.status})`;
    throw new Error(msg);
  }
  return data;
}

export async function uploadApi(formData) {
  const s = getAdminSession();
  const headers = {};
  if (s.userId) headers["x-user-id"] = s.userId;
  if (s.token) headers["x-session-token"] = s.token;
  const r = await fetch(`${BACKEND_URL}/api/upload`, { method: "POST", headers, body: formData });
  if (!r.ok) throw new Error("Upload failed");
  return r.json();
}
