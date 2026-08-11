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

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// API route for AI debt advice
app.post("/api/ai-insights", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "Chưa cấu hình GEMINI_API_KEY. Vui lòng thiết lập API Key trong cài đặt môi trường."
      });
    }

    const { debts } = req.body;
    if (!debts || !Array.isArray(debts)) {
      return res.status(400).json({ error: "Dữ liệu khoản nợ không hợp lệ." });
    }

    const ai = new GoogleGenAI({ apiKey });

    const debtContext = debts.map((d: any) => ({
      title: d.title,
      person: d.person,
      amount: d.amount,
      remaining: d.remainingAmount,
      type: d.type === 'BORROWED' ? 'Tôi nợ' : 'Họ nợ tôi',
      interest: d.interestRate + '%',
      dueDate: d.dueDate
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
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError: any = null;

    for (const model of modelsToTry) {
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
        console.warn(`Model ${model} failed, trying next...`, err?.message);
        lastError = err;
      }
    }

    if (!textResult) {
      throw lastError || new Error("Không nhận được phản hồi từ AI.");
    }

    return res.json({ text: textResult });
  } catch (error: any) {
    console.error("Gemini Server Error:", error);
    return res.status(500).json({
      error: error?.message || "Không thể kết nối với trí tuệ nhân tạo lúc này. Vui lòng thử lại sau."
    });
  }
});

// Return 404 JSON for unmatched /api requests
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API endpoint không tồn tại." });
});

// Global error handler for Express (always return JSON)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global Express Error:", err);
  res.status(500).json({ error: err?.message || "Lỗi máy chủ nội bộ." });
});

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
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: "API endpoint không tồn tại." });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
