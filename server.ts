import express from "express";
import path from "path";
import { handleAiInsightsRequest } from "./api/ai-insights";

const app = express();
const PORT = 3000;

app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// API Router
const apiRouter = express.Router();

// Health check handler
const handleHealth = (req: express.Request, res: express.Response) => {
  res.json({ status: "ok" });
};

apiRouter.get("/health", handleHealth);
app.get("/api/health", handleHealth);

// API route handler for AI debt advice
apiRouter.post("/ai-insights", handleAiInsightsRequest);
app.post("/api/ai-insights", handleAiInsightsRequest);
app.post("/ai-insights", handleAiInsightsRequest);

// Fallback for non-existent API endpoints
apiRouter.use((req, res) => {
  res.status(404).json({ error: "API endpoint không tồn tại." });
});

// Mount API router at /api
app.use("/api", apiRouter);

// Global error handler for Express (always return JSON)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global Express Error:", err);
  res.status(500).json({ error: err?.message || "Lỗi máy chủ nội bộ." });
});

export default app;

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.VERCEL !== "1") {
  startServer();
}
