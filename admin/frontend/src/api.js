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

const BUNNY_LIBRARY_ID = "707074";
const BUNNY_API_KEY = "f7d47361-1d7b-4154-8f8d64339b51-1c8e-4c20";
const BUNNY_CDN_HOST = "vz-a5ed34de-382.b-cdn.net";

export async function uploadVideoToBunny(file, onProgress) {
  const h = getAdminHeaders();
  const createRes = await fetch(`${BACKEND_URL}/api/bunny/create`, {
    method: "POST",
    headers: { ...h, "Content-Type": "application/json" },
    body: JSON.stringify({ title: file.name }),
  });
  if (!createRes.ok) throw new Error("Failed to create video entry");
  const { videoId } = await createRes.json();

  const formData = new FormData();
  formData.append("file", file);

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener("load", () => { if (xhr.status >= 200 && xhr.status < 300) resolve(); else reject(new Error("Upload failed")); });
    xhr.addEventListener("error", () => reject(new Error("Upload failed")));
    xhr.open("POST", `${BACKEND_URL}/api/bunny/upload/${videoId}`);
    Object.entries(h).forEach(([k, v]) => { if (k !== "Content-Type") xhr.setRequestHeader(k, v); });
    xhr.send(formData);
  });

  return `https://${BUNNY_CDN_HOST}/${videoId}/playlist.m3u8`;
}

export function getBunnyMp4Url(m3u8Url) {
  if (!m3u8Url || !m3u8Url.includes("b-cdn.net")) return m3u8Url;
  return m3u8Url.replace("/playlist.m3u8", "/360p.mp4");
}
