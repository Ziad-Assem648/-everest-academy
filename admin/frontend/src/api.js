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
  const data = await r.json();
  if (data.session_expired) {
    localStorage.removeItem("admin_session");
    window.location.reload();
    throw new Error("Session expired");
  }
  return data;
}
