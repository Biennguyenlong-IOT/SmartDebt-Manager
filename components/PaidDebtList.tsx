
import React, { useState } from 'react';
import { Debt, DebtType } from '../types';

interface PaidDebtListProps {
  debts: Debt[];
  onDelete: (id: string) => void;
}

const PaidDebtList: React.FC<PaidDebtListProps> = ({ debts, onDelete }) => {
  const [search, setSearch] = useState('');
  const [historyDebt, setHistoryDebt] = useState<Debt | null>(null);

  const filteredDebts = debts.filter(d => 
    d.title.toLowerCase().includes(search.toLowerCase()) || 
    d.person.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center">
        <h3 className="font-bold text-slate-800">Lịch sử hoàn thành ({debts.length})</h3>
        <div className="relative">
           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
           </span>
           <input 
             type="text" 
             value={search}
             onChange={e => setSearch(e.target.value)}
             placeholder="Tìm kiếm lịch sử..." 
             className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-64"
           />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Khoản nợ đã trả</th>
              <th className="px-6 py-4 font-semibold">Đối tác</th>
              <th className="px-6 py-4 font-semibold">Tổng tiền</th>
              <th className="px-6 py-4 font-semibold">Ngày hoàn thành</th>
              <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDebts.length > 0 ? filteredDebts.map(debt => {
              const lastPaymentDate = debt.payments.length > 0 
                ? new Date(Math.max(...debt.payments.map(p => new Date(p.date).getTime()))).toLocaleDateString('vi-VN')
                : 'N/A';
                
              return (
                <tr key={debt.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      </div>
                      <div>
                        <span className="font-medium text-slate-800 line-through opacity-60">{debt.title}</span>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase">{debt.type === DebtType.BORROWED ? 'Đã trả' : 'Đã thu hồi'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{debt.person}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-800">{formatCurrency(debt.amount)}</span>
                    <p className="text-[10px] text-slate-400">{debt.payments.length} đợt thanh toán</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {lastPaymentDate}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setHistoryDebt(debt)} title="Xem chi tiết" className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
                      </button>
                      <button onClick={() => onDelete(debt.id)} title="Xóa vĩnh viễn" className="p-2 hover:bg-red-100 rounded-lg text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-slate-400">Chưa có lịch sử thanh toán hoàn tất nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail History Modal */}
      {historyDebt && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50/30">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Chi tiết tất toán</h2>
                <p className="text-sm text-slate-500">{historyDebt.title} • {historyDebt.person}</p>
              </div>
              <button onClick={() => setHistoryDebt(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Số tiền gốc</p>
                    <p className="text-lg font-bold text-slate-800">{formatCurrency(historyDebt.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Trạng thái</p>
                    <p className="text-lg font-bold text-emerald-600 uppercase">Đã hoàn thành</p>
                  </div>
              </div>
              
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Lịch sử các đợt trả
              </h4>
              
              <div className="space-y-4">
                {historyDebt.payments.slice().reverse().map((payment, idx) => (
                  <div key={payment.id} className="flex gap-4 items-start border-l-2 border-emerald-200 pl-4 py-1">
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-slate-800">{formatCurrency(payment.amount)}</p>
                        <span className="text-xs text-slate-400">{new Date(payment.date).toLocaleDateString('vi-VN')}</span>
                      </div>
                      {payment.note && <p className="text-xs text-slate-500 italic mt-1">Ghi chú: {payment.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
               <button 
                 onClick={() => setHistoryDebt(null)}
                 className="px-6 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
               >
                 Đóng
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaidDebtList;
