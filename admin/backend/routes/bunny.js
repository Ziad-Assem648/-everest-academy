import express from "express";
import multer from "multer";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import https from "https";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const tmpDir = join(__dirname, "..", "tmp_uploads");
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const BUNNY_LIBRARY_ID = "718583";
const BUNNY_API_KEY = "a61113a8-d26d-4c6e-898e50577615-2a85-4b1b";
const BUNNY_CDN_HOST = "vz-7d98b775-100.b-cdn.net";

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, tmpDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${file.originalname.split(".").pop()}`),
  }),
  limits: { fileSize: 1024 * 1024 * 1024 },
});
const router = express.Router();

function streamUploadToBunny(filePath, videoId) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath);
    const stat = fs.statSync(filePath);
    const options = {
      hostname: "video.bunnycdn.com",
      path: `/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
      method: "PUT",
      headers: {
        "AccessKey": BUNNY_API_KEY,
        "Content-Type": "application/octet-stream",
        "Content-Length": stat.size,
      },
    };
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (c) => body += c);
      res.on("end", () => {
        try { fs.unlinkSync(filePath); } catch {}
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(`https://${BUNNY_CDN_HOST}/${videoId}/playlist.m3u8`);
        } else {
          reject(new Error(`Bunny upload failed (${res.statusCode}): ${body}`));
        }
      });
    });
    req.on("error", (e) => { try { fs.unlinkSync(filePath); } catch {} reject(e); });
    fileStream.pipe(req);
  });
}

router.post("/create", async (req, res) => {
  try {
    const { title } = req.body;
    const r = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`, {
      method: "POST",
      headers: { "AccessKey": BUNNY_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ title: title || "Untitled" }),
    });
    if (!r.ok) { const t = await r.text(); return res.status(r.status).json({ error: "Bunny create failed", detail: t }); }
    const data = await r.json();
    res.json({ videoId: data.guid });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/upload/:videoId", upload.single("file"), async (req, res) => {
  try {
    const { videoId } = req.params;
    if (!req.file) return res.status(400).json({ error: "No file" });
    const url = await streamUploadToBunny(req.file.path, videoId);
    res.json({ url, videoId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// TUS direct upload credentials — client uploads straight to Bunny (no server relay)
router.get("/tus-credentials/:videoId", async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) return res.status(400).json({ error: "videoId required" });
  const expirationTime = Math.floor(Date.now() / 1000) + 86400;
  const signature = crypto.createHash("sha256")
    .update(`${BUNNY_LIBRARY_ID}${BUNNY_API_KEY}${expirationTime}${videoId}`)
    .digest("hex");
  res.json({
    videoId,
    libraryId: BUNNY_LIBRARY_ID,
    expirationTime: String(expirationTime),
    signature,
    uploadEndpoint: "https://video.bunnycdn.com/tusupload",
  });
});

export default router;
