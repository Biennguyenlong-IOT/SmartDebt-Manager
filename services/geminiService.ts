import { Debt } from "../types";

export const getDebtAdvice = async (debts: Debt[]): Promise<string> => {
  try {
    const response = await fetch('/api/ai-insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ debts }),
    });

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await response.json();
      if (!response.ok) {
        return data.error || "Không thể kết nối với trí tuệ nhân tạo lúc này. Vui lòng kiểm tra lại API Key.";
      }
      return data.text || "Không có phản hồi từ AI.";
    } else {
      const errorText = await response.text();
      console.error("Non-JSON response from /api/ai-insights:", response.status, errorText);
      
      if (response.status === 404) {
        return "Máy chủ không tìm thấy API endpoint /api/ai-insights. Nếu triển khai trên Vercel, vui lòng đảm bảo đã thêm GEMINI_API_KEY trong Vercel Project Settings.";
      }
      
      return `Máy chủ trả về lỗi (${response.status}). Vui lòng kiểm tra lại GEMINI_API_KEY trong Cài đặt.`;
    }
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    return "Không thể kết nối với máy chủ AI. Vui lòng kiểm tra kết nối mạng và thử lại sau.";
  }
};

