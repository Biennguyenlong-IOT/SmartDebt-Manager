import { GoogleGenAI } from "@google/genai";

function sendJson(res: any, statusCode: number, data: any) {
  try {
    if (res.setHeader && !res.headersSent) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }
    if (typeof res.status === "function") {
      res.status(statusCode);
    } else {
      res.statusCode = statusCode;
    }
    if (typeof res.json === "function") {
      return res.json(data);
    } else {
      return res.end(JSON.stringify(data));
    }
  } catch (e) {
    console.error("Error sending response:", e);
    try {
      res.statusCode = statusCode;
      res.end(JSON.stringify(data));
    } catch (_) {}
  }
}

async function getParsedBody(req: any): Promise<any> {
  try {
    if (req.body) {
      if (typeof req.body === "object") return req.body;
      if (typeof req.body === "string") {
        try { return JSON.parse(req.body); } catch (_) {}
      }
    }
    if (typeof req.on === "function") {
      return new Promise((resolve) => {
        let data = "";
        req.on("data", (chunk: any) => { data += chunk; });
        req.on("end", () => {
          try { resolve(JSON.parse(data)); } catch (_) { resolve({}); }
        });
        req.on("error", () => resolve({}));
      });
    }
  } catch (_) {}
  return {};
}

export async function handleAiInsightsRequest(req: any, res: any) {
  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      if (res.setHeader && !res.headersSent) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      }
      if (typeof res.status === "function") {
        return res.status(200).end();
      }
      res.statusCode = 200;
      return res.end();
    }

    if (req.method !== "POST") {
      return sendJson(res, 405, { error: "Chỉ hỗ trợ phương thức POST." });
    }

    const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || "").trim();
    if (!apiKey) {
      return sendJson(res, 400, {
        error: "Biến môi trường GEMINI_API_KEY chưa có trên Vercel. Vui lòng vào Vercel Project Settings -> Environment Variables, thêm GEMINI_API_KEY, sau đó vào tab Deployments chọn Redeploy."
      });
    }

    const body = await getParsedBody(req);
    const debts = body?.debts;

    if (!debts || !Array.isArray(debts)) {
      return sendJson(res, 400, { error: "Dữ liệu danh sách khoản nợ không hợp lệ." });
    }

    let ai: GoogleGenAI;
    try {
      ai = new GoogleGenAI({ apiKey });
    } catch (initErr: any) {
      console.error("GoogleGenAI Init Error:", initErr);
      return sendJson(res, 400, {
        error: `Không thể khởi tạo Gemini SDK (${initErr?.message || "Khóa API không hợp lệ"}).`
      });
    }

    const debtContext = debts.map((d: any) => ({
      title: d.title || "Khoản nợ",
      person: d.person || "N/A",
      amount: d.amount || 0,
      remaining: d.remainingAmount ?? d.amount ?? 0,
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
          const errMsg = err?.message || String(err);
          console.warn(`Model ${model} attempt ${attempt} failed:`, errMsg);
          
          if ((errMsg.includes("503") || errMsg.includes("429") || errMsg.includes("UNAVAILABLE")) && attempt < 3) {
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
      const detailMsg = lastError?.message || "Không thể khởi tạo nội dung AI.";
      return sendJson(res, 500, {
        error: `Lỗi kết nối Gemini API: ${detailMsg}. Vui lòng kiểm tra lại GEMINI_API_KEY trên Vercel.`
      });
    }

    return sendJson(res, 200, { text: textResult });
  } catch (error: any) {
    console.error("Top-level Gemini Handler Error:", error);
    return sendJson(res, 500, {
      error: `Lỗi máy chủ serverless: ${error?.message || "Không thể xử lý yêu cầu."}`
    });
  }
}

export default async function handler(req: any, res: any) {
  return handleAiInsightsRequest(req, res);
}
