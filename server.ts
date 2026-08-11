import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

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
const handleAiInsights = async (req: express.Request, res: express.Response) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "Chưa cấu hình GEMINI_API_KEY. Vui lòng thêm GEMINI_API_KEY trong menu Cài đặt (Settings)."
      });
    }

    const { debts } = req.body || {};
    if (!debts || !Array.isArray(debts)) {
      return res.status(400).json({ error: "Dữ liệu khoản nợ không hợp lệ." });
    }

    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const debtContext = debts.map((d: any) => ({
      title: d.title,
      person: d.person,
      amount: d.amount,
      remaining: d.remainingAmount,
      type: d.type === 'BORROWED' ? 'Tôi nợ' : 'Họ nợ tôi',
      interest: (d.interestRate || 0) + '%',
      dueDate: d.dueDate || 'Không có'
    }));

    const prompt = `
      Dưới đây là danh sách các khoản nợ/cho vay của tôi:
      ${JSON.stringify(debtContext, null, 2)}
      
      Hãy phân tích và đưa ra:
      1. Tổng quan tình hình tài chính (nợ ròng).
      2. Thứ tự ưu tiên trả nợ (nếu có nợ đi vay) theo phương pháp Tuyết lăn (Snowball) hoặc Thác đổ (Avalanche).
      3. Cảnh báo các khoản nợ sắp đến hạn.
      4. Lời khuyên tối ưu hóa dòng tiền.
      
      Trả lời bằng tiếng Việt, ngắn gọn, súc tích và chuyên nghiệp dưới dạng Markdown.
    `;

    let textResult = "";
    const modelsToTry = ['gemini-3.6-flash', 'gemini-3.6-pro', 'gemini-2.5-pro', 'gemini-flash-latest'];
    let lastError: any = null;

    for (const model of modelsToTry) {
      // Try up to 3 times per model for transient errors like 503 / 429
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              temperature: 0.7,
              topP: 0.95,
            }
          });
          if (response.text) {
            textResult = response.text;
            break;
          }
        } catch (err: any) {
          lastError = err;
          const status = err?.status || err?.code || (err?.message?.includes("503") ? 503 : 0);
          console.warn(`Model ${model} attempt ${attempt} failed:`, err?.message || err);
          
          // If transient 503 / 429 error, wait before retrying
          if ((status === 503 || status === 429 || err?.message?.includes("503") || err?.message?.includes("UNAVAILABLE")) && attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
            continue;
          }
          // If NOT a transient error or last attempt, break to try next model
          break;
        }
      }
      if (textResult) {
        break;
      }
    }

    if (!textResult) {
      throw lastError || new Error("Không thể tạo phản hồi từ AI.");
    }

    return res.json({ text: textResult });
  } catch (error: any) {
    console.error("Gemini Server Error:", error);
    return res.status(500).json({
      error: error?.message || "Không thể kết nối với trí tuệ nhân tạo lúc này. Vui lòng thử lại sau."
    });
  }
};

apiRouter.post("/ai-insights", handleAiInsights);
app.post("/api/ai-insights", handleAiInsights);
app.post("/ai-insights", handleAiInsights);

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
