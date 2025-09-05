const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ✅ Database setup
const db = new sqlite3.Database("./screen.db", (err) => {
  if (err) console.error("DB error:", err);
  else {
    console.log("Connected to SQLite DB");
    db.run(
      "CREATE TABLE IF NOT EXISTS recordings (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)"
    );
  }
});

// ✅ Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `recording-${Date.now()}.webm`);
  },
});

const upload = multer({ storage });

// ✅ Routes
app.post("/upload", upload.single("video"), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");

  db.run("INSERT INTO recordings (filename) VALUES (?)", [req.file.filename], (err) => {
    if (err) return res.status(500).send("DB error");
    res.json({ message: "Uploaded successfully", filename: req.file.filename });
  });
});

app.get("/recordings", (req, res) => {
  db.all("SELECT * FROM recordings ORDER BY created_at DESC", [], (err, rows) => {
    if (err) return res.status(500).send("DB error");
    res.json(rows);
  });
});

app.use("/files", express.static(path.join(__dirname, "uploads")));

app.listen(PORT, () => console.log(`✅ Backend running at http://localhost:${PORT}`));
