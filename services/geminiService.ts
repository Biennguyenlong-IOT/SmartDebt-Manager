
import { GoogleGenAI, Type } from "@google/genai";
import { Debt } from "../types";

// Always use the recommended initialization with process.env.API_KEY as a named parameter
export const getDebtAdvice = async (debts: Debt[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const debtContext = debts.map(d => ({
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
    ${JSON.stringify(debtContext)}
    
    Hãy phân tích và đưa ra:
    1. Tổng quan tình hình tài chính (nợ ròng).
    2. Thứ tự ưu tiên trả nợ (nếu có nợ đi vay) theo phương pháp Tuyết lăn (Snowball) hoặc Thác đổ (Avalanche).
    3. Cảnh báo các khoản nợ sắp đến hạn.
    4. Lời khuyên tối ưu hóa dòng tiền.
    
    Trả lời bằng tiếng Việt, ngắn gọn, súc tích và chuyên nghiệp dưới dạng Markdown.
  `;

  try {
    // Using gemini-3-pro-preview for tasks requiring advanced reasoning and financial analysis
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });
    // Correctly access the .text property (not a method) from GenerateContentResponse
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Không thể kết nối với trí tuệ nhân tạo lúc này. Vui lòng thử lại sau.";
  }
};
