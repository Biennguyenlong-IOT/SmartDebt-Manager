import { GoogleGenAI } from "@google/genai";

export async function handleAiInsightsRequest(req: any, res: any) {
  // CORS Headers
  if (res.setHeader) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  if (req.method === "OPTIONS") {
    if (res.status) {
      return res.status(200).end();
    }
    return res.end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Chỉ hỗ trợ phương thức POST." });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "Chưa nhận được GEMINI_API_KEY trên Vercel. Vui lòng kiểm tra lại Settings -> Environment Variables trên Vercel (đảm bảo gõ đúng tên GEMINI_API_KEY) và chọn Redeploy."
      });
    }

    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: "Dữ liệu JSON gửi lên không hợp lệ." });
      }
    }

    const debts = body?.debts;
    if (!debts || !Array.isArray(debts)) {
      return res.status(400).json({ error: "Dữ liệu danh sách khoản nợ không hợp lệ." });
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
          
          if ((status === 503 || status === 429 || err?.message?.includes("503") || err?.message?.includes("UNAVAILABLE")) && attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
            continue;
          }
          break;
        }
      }
      if (textResult) {
        break;
      }
    }

    if (!textResult) {
      throw lastError || new Error("Không thể kết nối với AI Gemini. Vui lòng kiểm tra lại API Key.");
    }

    return res.status(200).json({ text: textResult });
  } catch (error: any) {
    console.error("Gemini Server Error:", error);
    return res.status(500).json({
      error: error?.message || "Lỗi xử lý AI trên máy chủ serverless."
    });
  }
}

export default async function handler(req: any, res: any) {
  return handleAiInsightsRequest(req, res);
}
