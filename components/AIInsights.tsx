
import React, { useState, useEffect } from 'react';
import { Debt } from '../types';
import { getDebtAdvice } from '../services/geminiService';

interface AIInsightsProps {
  debts: Debt[];
}

const AIInsights: React.FC<AIInsightsProps> = ({ debts }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAdvice = async () => {
    if (debts.length === 0) return;
    setLoading(true);
    const advice = await getDebtAdvice(debts);
    setInsight(advice || 'Đã có lỗi xảy ra.');
    setLoading(false);
  };

  useEffect(() => {
    fetchAdvice();
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8M16 4h-4M12 12v4M12 16H8M16 16h-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9Z"/><path d="M12 12h.01"/></svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Cố vấn Tài chính AI</h3>
            <p className="text-xs text-indigo-600">Phân tích chuyên sâu bởi Gemini 3 Pro</p>
          </div>
        </div>
        <button 
          onClick={fetchAdvice}
          disabled={loading}
          className="px-4 py-2 bg-white border border-indigo-200 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-50 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
          )}
          Làm mới phân tích
        </button>
      </div>

      <div className="p-8 flex-1 prose prose-indigo max-w-none">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
            <div className="flex space-x-2">
              <div className="h-3 w-3 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="h-3 w-3 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="h-3 w-3 bg-indigo-600 rounded-full animate-bounce"></div>
            </div>
            <p className="text-slate-500 animate-pulse">Đang nghiên cứu tình hình nợ của bạn...</p>
          </div>
        ) : insight ? (
          <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
            {insight.split('\n').map((line, i) => {
              if (line.startsWith('#')) return <h3 key={i} className="text-xl font-bold text-indigo-900 mt-6 mb-2">{line.replace(/#/g, '')}</h3>;
              if (line.startsWith('*') || line.startsWith('-')) return <div key={i} className="flex gap-2 mb-1"><span className="text-indigo-500">•</span> <span>{line.substring(1).trim()}</span></div>;
              return <p key={i} className="mb-2">{line}</p>;
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <p className="text-slate-500">Hãy thêm ít nhất một khoản nợ để AI có thể bắt đầu phân tích.</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-center uppercase tracking-widest">
        AI có thể có sai sót, vui lòng tham vấn chuyên gia tài chính cho các quyết định quan trọng.
      </div>
    </div>
  );
};

export default AIInsights;
