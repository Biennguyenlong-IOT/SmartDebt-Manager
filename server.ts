import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Server Error:", error);
    return res.status(500).json({
      error: error?.message || "Không thể kết nối với trí tuệ nhân tạo lúc này. Vui lòng thử lại sau."
    });
  }
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
    app.use((req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
