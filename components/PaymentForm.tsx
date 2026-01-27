
import React, { useState, useEffect } from 'react';
import { Debt, Payment } from '../types';

interface PaymentFormProps {
  debt: Debt;
  onClose: () => void;
  onSubmit: (debtId: string, payment: Omit<Payment, 'id'>) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ debt, onClose, onSubmit }) => {
  const [paymentAmount, setPaymentAmount] = useState<number>(debt.remainingAmount);
  const [displayAmount, setDisplayAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState('');

  useEffect(() => {
    setDisplayAmount(formatNumber(debt.remainingAmount.toString()));
  }, [debt]);

  function formatNumber(val: string) {
    if (!val) return '';
    const cleanValue = val.toString().replace(/\D/g, '');
    if (cleanValue === '') return '';
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function unformatNumber(val: string): number {
    return parseInt(val.replace(/\./g, ''), 10) || 0;
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatNumber(rawValue);
    const numericValue = unformatNumber(formattedValue);
    
    // Giới hạn không vượt quá nợ còn lại
    const finalNumeric = Math.min(numericValue, debt.remainingAmount);
    setDisplayAmount(formatNumber(finalNumeric.toString()));
    setPaymentAmount(finalNumeric);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const step = 1000;
      const currentVal = paymentAmount;
      let newVal = e.key === 'ArrowUp' ? currentVal + step : currentVal - step;
      
      // Kiểm tra biên
      newVal = Math.max(0, Math.min(newVal, debt.remainingAmount));
      
      setDisplayAmount(formatNumber(newVal.toString()));
      setPaymentAmount(newVal);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount > 0) {
      onSubmit(debt.id, {
        amount: paymentAmount,
        date: paymentDate,
        note: paymentNote
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50/20">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Ghi nhận thanh toán</h2>
            <p className="text-sm text-slate-500">{debt.title} - {debt.person}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-500 font-medium uppercase tracking-wider">Dư nợ hiện tại:</span>
              <span className="text-slate-800 font-bold">{formatCurrency(debt.remainingAmount)}</span>
            </div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Số tiền thanh toán (VND)</label>
            <input
              required
              type="text"
              inputMode="numeric"
              value={displayAmount}
              onChange={handleAmountChange}
              onKeyDown={handleKeyDown}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-bold text-emerald-600"
              placeholder="0"
            />
            <p className="text-[10px] text-slate-400 mt-1 italic">Dùng phím ↑↓ để tăng/giảm 1.000đ</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ngày thực hiện</label>
            <input
              required
              type="date"
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú (không bắt buộc)</label>
            <input
              type="text"
              value={paymentNote}
              onChange={e => setPaymentNote(e.target.value)}
              placeholder="Vd: Chuyển khoản ngân hàng..."
              className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            />
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
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-lg"
            >
              Xác nhận
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
