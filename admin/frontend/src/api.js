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
  const url = path.startsWith("http") ? path : `${BACKEND_URL}${path}`;
  const r = await fetch(url, { headers, ...opts });
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
  const uploadUrl = window.location.origin.includes("localhost")
    ? `${BACKEND_URL}/api/upload`
    : '/upload.php';
  const s = getAdminSession();
  const headers = {};
  if (s.userId) headers["x-user-id"] = s.userId;
  if (s.token) headers["x-session-token"] = s.token;
  const r = await fetch(uploadUrl, { method: "POST", headers, body: formData });
  if (!r.ok) throw new Error("Upload failed");
  return r.json();
}

const BUNNY_LIBRARY_ID = "706401";
const BUNNY_API_KEY = "6e7edf56-4918-4a5b-9f8060488a19-7765-415b";
const BUNNY_CDN_HOST = "vz-c77ef25f-4d4.b-cdn.net";

export async function uploadVideoToBunny(file, onProgress) {
  const h = getAdminHeaders();
  const createRes = await fetch(`${BACKEND_URL}/api/bunny/create`, {
    method: "POST",
    headers: { ...h, "Content-Type": "application/json" },
    body: JSON.stringify({ title: file.name }),
  });
  if (!createRes.ok) throw new Error("Failed to create video entry");
  const { videoId } = await createRes.json();

  const credRes = await fetch(`${BACKEND_URL}/api/bunny/tus-credentials/${videoId}`, { headers: h });
  if (!credRes.ok) throw new Error("Failed to get upload credentials");
  const cred = await credRes.json();

  // Upload directly to Bunny Stream (TUS resumable) — bypasses the backend server entirely
  const { Upload } = await import("tus-js-client");
  await new Promise((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: cred.uploadEndpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000, 60000],
      chunkSize: 5 * 1024 * 1024,
      fingerprint: (f) => Promise.resolve(`everest-bunny-${videoId}-${f.name}-${f.size}`),
      headers: {
        AuthorizationSignature: cred.signature,
        AuthorizationExpire: cred.expirationTime,
        VideoId: cred.videoId,
        LibraryId: cred.libraryId,
      },
      metadata: { filetype: file.type, title: file.name },
      onError: reject,
      onProgress: (bytesUploaded, bytesTotal) => {
        if (bytesTotal && onProgress) onProgress(Math.round((bytesUploaded / bytesTotal) * 100));
      },
      onSuccess: resolve,
    });
    upload.findPreviousUploads().then((prev) => {
      if (prev.length) upload.resumeFromPreviousUpload(prev[0]);
      upload.start();
    }).catch(() => upload.start());
  });

  return `https://${BUNNY_CDN_HOST}/${videoId}/playlist.m3u8`;
}

export function getBunnyMp4Url(m3u8Url) {
  if (!m3u8Url || !m3u8Url.includes("b-cdn.net")) return m3u8Url;
  return m3u8Url.replace("/playlist.m3u8", "/360p.mp4");
}
