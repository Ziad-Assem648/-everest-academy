import express from "express";
import multer from "multer";

const BUNNY_LIBRARY_ID = "707074";
const BUNNY_API_KEY = "f7d47361-1d7b-4154-8f8d64339b51-1c8e-4c20";
const BUNNY_CDN_HOST = "vz-a5ed34de-382.b-cdn.net";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });
const router = express.Router();

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
    const r = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`, {
      method: "PUT",
      headers: { "AccessKey": BUNNY_API_KEY, "Content-Type": "application/octet-stream" },
      body: req.file.buffer,
    });
    if (!r.ok) { const t = await r.text(); return res.status(r.status).json({ error: "Bunny upload failed", detail: t }); }
    const url = `https://${BUNNY_CDN_HOST}/${videoId}/playlist.m3u8`;
    res.json({ url, videoId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
