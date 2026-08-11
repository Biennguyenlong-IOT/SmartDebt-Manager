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

    const data = await response.json();

    if (!response.ok) {
      return data.error || "Không thể kết nối với trí tuệ nhân tạo lúc này. Vui lòng kiểm tra lại API Key.";
    }

    return data.text || "Không có phản hồi từ AI.";
  } catch (error) {
    console.error("Gemini Service Error:", error);
    return "Không thể kết nối với máy chủ AI. Vui lòng kiểm tra kết nối mạng và thử lại sau.";
  }
};
