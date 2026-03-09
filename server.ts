import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "tasks.db");
console.log(`Initializing database at: ${dbPath}`);
const db = new Database(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    recordId TEXT PRIMARY KEY,
    sourceSheet TEXT,
    weekNo INTEGER,
    fromDate TEXT,
    toDate TEXT,
    department TEXT,
    workstream TEXT,
    sectionType TEXT,
    taskTitle TEXT,
    taskDescription TEXT,
    startDate TEXT,
    endDate TEXT,
    status TEXT,
    progress INTEGER,
    owner TEXT,
    notes TEXT,
    result TEXT,
    lastUpdate TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Request logger
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || "development"
    });
  });

  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    // Simple shared account for the project
    if (username === "admin" && password === "bana2026") {
      res.json({ success: true, user: { username: "admin", name: "Quản trị viên" } });
    } else {
      res.status(401).json({ success: false, message: "Tên đăng nhập hoặc mật khẩu không đúng" });
    }
  });

  app.get("/api/settings/:key", (req, res) => {
    const { key } = req.params;
    try {
      const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
      res.json(row ? JSON.parse(row.value) : null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch setting" });
    }
  });

  app.post("/api/settings/:key", (req, res) => {
    const { key } = req.params;
    const value = JSON.stringify(req.body);
    try {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save setting" });
    }
  });

  app.get("/api/tasks", (req, res) => {
    try {
      const tasks = db.prepare("SELECT * FROM tasks").all();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", (req, res) => {
    const task = req.body;
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO tasks (
          recordId, sourceSheet, weekNo, fromDate, toDate, department, 
          workstream, sectionType, taskTitle, taskDescription, 
          startDate, endDate, status, progress, owner, notes, result, lastUpdate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        task.recordId, task.sourceSheet, task.weekNo, task.fromDate, task.toDate, task.department,
        task.workstream, task.sectionType, task.taskTitle, task.taskDescription,
        task.startDate, task.endDate, task.status, task.progress, task.owner, task.notes, task.result, task.lastUpdate
      );
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to save task" });
    }
  });

  app.delete("/api/tasks/:recordId", (req, res) => {
    const { recordId } = req.params;
    try {
      db.prepare("DELETE FROM tasks WHERE recordId = ?").run(recordId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
