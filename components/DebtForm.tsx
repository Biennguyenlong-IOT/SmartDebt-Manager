
import React, { useState, useEffect } from 'react';
import { Debt, DebtType, DebtStatus } from '../types';

interface DebtFormProps {
  onClose: () => void;
  onSubmit: (debt: Debt) => void;
  initialData?: Debt;
}

const DebtForm: React.FC<DebtFormProps> = ({ onClose, onSubmit, initialData }) => {
  const [isIndefinite, setIsIndefinite] = useState(false);
  const [formData, setFormData] = useState<Partial<Debt>>({
    title: '',
    person: '',
    amount: 0,
    type: DebtType.BORROWED,
    interestRate: 0,
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: DebtStatus.ACTIVE,
    description: '',
    payments: []
  });

  const [displayAmount, setDisplayAmount] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setIsIndefinite(initialData.dueDate === null);
      setDisplayAmount(formatNumber(initialData.amount.toString()));
    } else {
      setDisplayAmount('0');
    }
  }, [initialData]);

  function formatNumber(val: string) {
    if (!val) return '';
    const cleanValue = val.toString().replace(/\D/g, '');
    if (cleanValue === '') return '';
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function unformatNumber(val: string): number {
    return parseInt(val.replace(/\./g, ''), 10) || 0;
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatNumber(rawValue);
    setDisplayAmount(formattedValue);
    setFormData({ ...formData, amount: unformatNumber(formattedValue) });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const step = 1000;
      const currentVal = unformatNumber(displayAmount);
      const newVal = e.key === 'ArrowUp' ? currentVal + step : Math.max(0, currentVal - step);
      const formatted = formatNumber(newVal.toString());
      setDisplayAmount(formatted);
      setFormData({ ...formData, amount: newVal });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalDebt: Debt = {
      ...formData as Debt,
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      dueDate: isIndefinite ? null : (formData.dueDate || null),
      remainingAmount: initialData?.id ? formData.remainingAmount! : formData.amount!,
      payments: initialData?.payments || []
    };
    onSubmit(finalDebt);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/20">
          <h2 className="text-xl font-bold text-slate-800">{initialData ? 'Chỉnh sửa khoản nợ' : 'Thêm khoản nợ mới'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Tên khoản nợ</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="Vd: Vay tiêu dùng, Cho mượn tiền mặt..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Loại hình</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as DebtType })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value={DebtType.BORROWED}>Tôi đi vay (Nợ phải trả)</option>
                <option value={DebtType.LENT}>Tôi cho vay (Phải thu hồi)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {formData.type === DebtType.BORROWED ? 'Tên Chủ nợ (Lender)' : 'Tên Người vay (Borrower)'}
              </label>
              <input
                required
                type="text"
                value={formData.person}
                onChange={e => setFormData({ ...formData, person: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="Nhập tên đối tác..."
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">Số tiền gốc (VND)</label>
              <input
                required
                type="text"
                inputMode="numeric"
                value={displayAmount}
                onChange={handleAmountChange}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                placeholder="0"
              />
              <p className="text-[10px] text-slate-400 mt-1">Dùng phím ↑↓ để tăng/giảm 1.000đ</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lãi suất (%/năm)</label>
              <input
                type="number"
                step="0.1"
                value={formData.interestRate}
                onChange={e => setFormData({ ...formData, interestRate: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ngày bắt đầu</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Ngày đến hạn</label>
                <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isIndefinite} 
                    onChange={e => setIsIndefinite(e.target.checked)} 
                    className="rounded"
                  />
                  Vô thời hạn
                </label>
              </div>
              <input
                required={!isIndefinite}
                disabled={isIndefinite}
                type="date"
                value={formData.dueDate || ''}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className={`w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 ${isIndefinite ? 'bg-slate-50 opacity-50' : ''}`}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú chi tiết</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                placeholder="Mô tả thêm về khoản nợ..."
              />
            </div>
          </div>
          
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg"
            >
              {initialData ? 'Lưu cập nhật' : 'Hoàn tất'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DebtForm;
