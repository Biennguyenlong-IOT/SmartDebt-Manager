
import React from 'react';
import { Debt, DebtType, DebtStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface DashboardProps {
  stats: { totalBorrowed: number; totalLent: number };
  debts: Debt[];
  onRecordPayment: (debt: Debt) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, debts, onRecordPayment }) => {
  const activeDebts = debts.filter(d => d.status !== DebtStatus.PAID);
  const todayStr = new Date().toISOString().split('T')[0];
  
  const pieData = [
    { name: 'Nợ phải trả', value: stats.totalBorrowed, color: '#ef4444' },
    { name: 'Đang cho vay', value: stats.totalLent, color: '#10b981' }
  ].filter(d => d.value > 0);

  const partnerStats = activeDebts.reduce((acc, debt) => {
    const key = debt.person;
    if (!acc[key]) acc[key] = { name: key, borrowed: 0, lent: 0 };
    if (debt.type === DebtType.BORROWED) acc[key].borrowed += debt.remainingAmount;
    else acc[key].lent += debt.remainingAmount;
    return acc;
  }, {} as Record<string, { name: string; borrowed: number; lent: number }>);

  // Added explicit type cast to fix "Property does not exist on type unknown" errors in TypeScript environments where Object.values inference is limited
  const topPartners = (Object.values(partnerStats) as Array<{ name: string; borrowed: number; lent: number }>)
    .sort((a, b) => (b.borrowed + b.lent) - (a.borrowed + a.lent))
    .slice(0, 5);

  const todayTasks = activeDebts
    .filter(d => d.dueDate === null || d.dueDate <= todayStr)
    .sort((a, b) => {
      if (a.dueDate === b.dueDate) return 0;
      if (a.dueDate === null) return 1;
      if (b.dueDate === null) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 9-7 7-7-7"/></svg>
            </div>
            <span className="text-slate-500 font-medium">Tổng nợ phải trả</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">{formatCurrency(stats.totalBorrowed)}</p>
          <div className="mt-2 text-xs text-slate-400">Từ {activeDebts.filter(d => d.type === DebtType.BORROWED).length} chủ nợ</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 15 7-7 7 7"/></svg>
            </div>
            <span className="text-slate-500 font-medium">Tổng tiền cho vay</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">{formatCurrency(stats.totalLent)}</p>
          <div className="mt-2 text-xs text-slate-400">Đang cho {activeDebts.filter(d => d.type === DebtType.LENT).length} người vay</div>
        </div>

        <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg text-white md:col-span-2 lg:col-span-1 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Số dư nợ ròng (Net)</p>
              <p className="text-3xl font-bold">{formatCurrency(stats.totalLent - stats.totalBorrowed)}</p>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <p className="text-xs text-indigo-100 mt-4 opacity-80 italic">Cân đối tài chính giữa nợ vay và cho vay.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            Cấu trúc nợ ròng
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-6 border-t border-slate-100 pt-6">
            <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Đối tác chính (Lender/Borrower)
            </h4>
            <div className="space-y-3">
              {topPartners.length > 0 ? topPartners.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">{p.name}</span>
                  <div className="flex gap-4">
                    {p.borrowed > 0 && <span className="text-red-500 font-bold">-{formatCurrency(p.borrowed)}</span>}
                    {p.lent > 0 && <span className="text-emerald-500 font-bold">+{formatCurrency(p.lent)}</span>}
                  </div>
                </div>
              )) : <p className="text-slate-400 text-xs text-center py-4 italic">Chưa có dữ liệu đối tác</p>}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
               Việc cần làm hôm nay
            </h3>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded uppercase tracking-wider">
              {new Date().toLocaleDateString('vi-VN')}
            </span>
          </div>

          <div className="space-y-4 flex-1">
            {todayTasks.length > 0 ? todayTasks.map(debt => (
              <div 
                key={debt.id} 
                className="group flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-emerald-50 transition-all cursor-pointer border-l-4 border-l-indigo-500 hover:border-l-emerald-500 hover:shadow-md" 
                onClick={() => onRecordPayment(debt)}
                title="Click để ghi nhận trả nợ ngay"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${debt.type === DebtType.BORROWED ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{debt.title}</p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <span className="font-semibold text-slate-700">{debt.type === DebtType.BORROWED ? 'Trả cho:' : 'Thu từ:'}</span>
                      {debt.person}
                    </p>
                    <p className={`text-[10px] mt-1 font-medium ${
                      debt.dueDate === null ? 'text-slate-500 italic' : 
                      debt.dueDate === todayStr ? 'text-indigo-600' : 'text-red-500'
                    }`}>
                      {debt.dueDate === null ? 'Vô thời hạn' : 
                       debt.dueDate === todayStr ? 'Hạn hôm nay' : 'Đã quá hạn'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800 text-sm">{formatCurrency(debt.remainingAmount)}</p>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${debt.type === DebtType.BORROWED ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {debt.type === DebtType.BORROWED ? 'Chi trả' : 'Thu hồi'}
                  </span>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 italic text-sm text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 opacity-50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                <p>Tuyệt vời! Hiện tại bạn không có<br/>lịch hẹn thanh toán nào.</p>
              </div>
            )}
          </div>
          
          {activeDebts.length > todayTasks.length && (
            <div className="mt-6 pt-4 border-t border-slate-100">
               <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest font-medium">
                 Có {activeDebts.length - todayTasks.length} khoản nợ khác chưa đến hạn
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
