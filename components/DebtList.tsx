
import React, { useState } from 'react';
import { Debt, DebtType, DebtStatus, Payment } from '../types';

interface DebtListProps {
  debts: Debt[];
  onDelete: (id: string) => void;
  onEdit: (debt: Debt) => void;
  onRecordPayment: (debt: Debt) => void;
}

const DebtList: React.FC<DebtListProps> = ({ debts, onDelete, onEdit, onRecordPayment }) => {
  const [filter, setFilter] = useState<'ALL' | 'BORROWED' | 'LENT'>('ALL');
  const [search, setSearch] = useState('');
  const [historyDebt, setHistoryDebt] = useState<Debt | null>(null);
  
  const filteredDebts = debts.filter(d => {
    const matchesFilter = filter === 'ALL' || d.type === filter;
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase()) || 
                         d.person.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
          {(['ALL', 'BORROWED', 'LENT'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                filter === f ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f === 'ALL' ? 'Tất cả' : f === 'BORROWED' ? 'Tôi nợ' : 'Cho vay'}
            </button>
          ))}
        </div>
        <div className="relative">
           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
           </span>
           <input 
             type="text" 
             value={search}
             onChange={e => setSearch(e.target.value)}
             placeholder="Tìm kiếm..." 
             className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-64"
           />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Khoản nợ</th>
              <th className="px-6 py-4 font-semibold">Đối tác</th>
              <th className="px-6 py-4 font-semibold">Còn lại</th>
              <th className="px-6 py-4 font-semibold">Lãi suất</th>
              <th className="px-6 py-4 font-semibold">Hạn thanh toán</th>
              <th className="px-6 py-4 font-semibold">Trạng thái</th>
              <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDebts.length > 0 ? filteredDebts.map(debt => (
              <tr key={debt.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${debt.type === DebtType.BORROWED ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </div>
                    <div>
                       <span className="font-medium text-slate-800">{debt.title}</span>
                       {debt.payments.length > 0 && (
                         <button 
                           onClick={() => setHistoryDebt(debt)}
                           className="text-[10px] text-indigo-600 hover:underline block"
                         >
                           Đã trả {debt.payments.length} đợt (Xem lịch sử)
                         </button>
                       )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">{debt.person}</td>
                <td className="px-6 py-4">
                  <span className={`font-bold ${debt.remainingAmount > 0 ? 'text-slate-800' : 'text-emerald-600'}`}>
                    {formatCurrency(debt.remainingAmount)}
                  </span>
                  <p className="text-[10px] text-slate-400">Gốc: {formatCurrency(debt.amount)}</p>
                </td>
                <td className="px-6 py-4 text-slate-600">{debt.interestRate}%/năm</td>
                <td className="px-6 py-4 text-slate-600">
                  {debt.dueDate ? new Date(debt.dueDate).toLocaleDateString('vi-VN') : (
                    <span className="text-slate-400 italic">Vô thời hạn</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    debt.status === DebtStatus.ACTIVE ? 'bg-blue-100 text-blue-600' : 
                    debt.status === DebtStatus.PAID ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {debt.status === DebtStatus.ACTIVE ? 'Đang nợ' : debt.status === DebtStatus.PAID ? 'Đã xong' : 'Quá hạn'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {debt.status !== DebtStatus.PAID && (
                      <button 
                        onClick={() => onRecordPayment(debt)} 
                        title="Thanh toán"
                        className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      </button>
                    )}
                    <button onClick={() => setHistoryDebt(debt)} title="Lịch sử" className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
                    </button>
                    <button onClick={() => onEdit(debt)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </button>
                    <button onClick={() => onDelete(debt.id)} className="p-2 hover:bg-red-100 rounded-lg text-red-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center text-slate-400">Không tìm thấy dữ liệu phù hợp.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* History Modal */}
      {historyDebt && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/30">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Lịch sử thanh toán</h2>
                <p className="text-sm text-slate-500">{historyDebt.title} • {historyDebt.person}</p>
              </div>
              <button onClick={() => setHistoryDebt(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {historyDebt.payments.length > 0 ? (
                <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-100 before:z-0">
                  {historyDebt.payments.slice().reverse().map((payment, idx) => (
                    <div key={payment.id} className="relative z-10 pl-10">
                      <div className="absolute left-0 top-1.5 w-8 h-8 bg-white border-2 border-indigo-500 rounded-full flex items-center justify-center text-indigo-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Đợt {historyDebt.payments.length - idx}</span>
                          <span className="text-xs text-slate-400">{new Date(payment.date).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <p className="text-lg font-bold text-slate-800">{formatCurrency(payment.amount)}</p>
                        {payment.note && (
                          <p className="text-sm text-slate-500 mt-2 bg-white/50 p-2 rounded italic">
                            &ldquo;{payment.note}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">Chưa có lịch sử thanh toán nào.</div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
               <div className="text-sm">
                 <span className="text-slate-500">Tổng đã trả: </span>
                 <span className="font-bold text-emerald-600">{formatCurrency(historyDebt.amount - historyDebt.remainingAmount)}</span>
               </div>
               <button 
                 onClick={() => setHistoryDebt(null)}
                 className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
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

export default DebtList;
