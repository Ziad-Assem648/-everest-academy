import express from "express";
import { query, execute } from "../db.js";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "uploads");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM proofs ORDER BY sort_order ASC, created_at DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Image required" });
    const id = uuidv4();
    const imagePath = "/uploads/" + req.file.filename;
    await execute("INSERT INTO proofs (id, image, caption, sort_order) VALUES (?, ?, ?, ?)",
      [id, imagePath, req.body.caption || "", parseInt(req.body.sort_order) || 0]);
    const rows = await query("SELECT * FROM proofs WHERE id = ?", [id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    if (req.file) {
      const imagePath = "/uploads/" + req.file.filename;
      await execute("UPDATE proofs SET image = ?, caption = ?, sort_order = ? WHERE id = ?",
        [imagePath, req.body.caption || "", parseInt(req.body.sort_order) || 0, req.params.id]);
    } else {
      await execute("UPDATE proofs SET caption = ?, sort_order = ? WHERE id = ?",
        [req.body.caption || "", parseInt(req.body.sort_order) || 0, req.params.id]);
    }
    const rows = await query("SELECT * FROM proofs WHERE id = ?", [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await execute("DELETE FROM proofs WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
