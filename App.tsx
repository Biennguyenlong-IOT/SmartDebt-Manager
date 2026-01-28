
import React, { useState, useEffect, useMemo } from 'react';
import { Debt, DebtType, DebtStatus, Payment } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DebtList from './components/DebtList';
import DebtForm from './components/DebtForm';
import AIInsights from './components/AIInsights';
import PaidDebtList from './components/PaidDebtList';
import PaymentForm from './components/PaymentForm';

// Firebase imports
import { db, isFirebaseConfigured } from './services/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy
} from "firebase/firestore";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'debts' | 'ai' | 'history'>('dashboard');
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFirebase, setUsingFirebase] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | undefined>(undefined);
  const [payingDebt, setPayingDebt] = useState<Debt | undefined>(undefined);

  const saveToLocal = (data: Debt[]) => {
    localStorage.setItem('smart_debts_backup', JSON.stringify(data));
  };

  const getFromLocal = (): Debt[] => {
    const saved = localStorage.getItem('smart_debts_backup');
    return saved ? JSON.parse(saved) : [];
  };

  const initFirebaseConnection = () => {
    if (!isFirebaseConfigured || !db) {
      setDebts(getFromLocal());
      setUsingFirebase(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setFirebaseError(null);

    const q = query(collection(db, "debts"), orderBy("startDate", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const debtsData: Debt[] = [];
      querySnapshot.forEach((doc) => {
        debtsData.push({ id: doc.id, ...doc.data() } as Debt);
      });
      setDebts(debtsData);
      saveToLocal(debtsData);
      setUsingFirebase(true);
      setFirebaseError(null);
      setLoading(false);
    }, (error: any) => {
      console.error("Firestore error:", error);
      setUsingFirebase(false);
      
      if (error.code === 'permission-denied' || error.message.toLowerCase().includes('permission')) {
        setFirebaseError("Lỗi quyền hạn: Vui lòng vào Firebase Console -> Firestore -> Rules và đổi thành 'allow read, write: if true;'");
      } else {
        setFirebaseError("Lỗi kết nối: Đang sử dụng chế độ Offline (Local).");
      }
      
      setDebts(getFromLocal());
      setLoading(false);
    });

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribe = initFirebaseConnection();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const stats = useMemo(() => {
    return debts.reduce((acc, debt) => {
      if (debt.status !== DebtStatus.PAID) {
        if (debt.type === DebtType.BORROWED) acc.totalBorrowed += debt.remainingAmount;
        else acc.totalLent += debt.remainingAmount;
      }
      return acc;
    }, { totalBorrowed: 0, totalLent: 0 });
  }, [debts]);

  const handleAddOrUpdateDebt = async (debt: Debt) => {
    if (usingFirebase && db) {
      try {
        if (editingDebt) {
          const debtRef = doc(db, "debts", editingDebt.id);
          const { id, ...data } = debt;
          await updateDoc(debtRef, data);
        } else {
          const { id, ...data } = debt;
          await addDoc(collection(db, "debts"), data);
        }
      } catch (e) {
        handleLocalSave(debt);
      }
    } else {
      handleLocalSave(debt);
    }
    setIsFormOpen(false);
    setEditingDebt(undefined);
  };

  const handleLocalSave = (debt: Debt) => {
    const updated = editingDebt 
      ? debts.map(d => d.id === editingDebt.id ? debt : d)
      : [...debts, { ...debt, id: Math.random().toString(36).substr(2, 9) }];
    setDebts(updated);
    saveToLocal(updated);
  };

  const handleRecordPayment = async (debtId: string, payment: Omit<Payment, 'id'>) => {
    const debt = debts.find(d => d.id === debtId);
    if (!debt) return;

    const newRemaining = Math.max(0, debt.remainingAmount - payment.amount);
    const newStatus = newRemaining <= 0 ? DebtStatus.PAID : debt.status;
    const newPayments = [...debt.payments, { ...payment, id: Math.random().toString(36).substr(2, 9) }];

    if (usingFirebase && db) {
      try {
        const debtRef = doc(db, "debts", debtId);
        await updateDoc(debtRef, {
          remainingAmount: newRemaining,
          status: newStatus,
          payments: newPayments
        });
      } catch (e) {
        updateLocalPayment(debtId, newRemaining, newStatus, newPayments);
      }
    } else {
      updateLocalPayment(debtId, newRemaining, newStatus, newPayments);
    }
    setPayingDebt(undefined);
  };

  const updateLocalPayment = (id: string, rem: number, status: DebtStatus, pays: Payment[]) => {
    const updated = debts.map(d => d.id === id ? { ...d, remainingAmount: rem, status, payments: pays } : d);
    setDebts(updated);
    saveToLocal(updated);
  };

  const handleDeleteDebt = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa?')) return;
    
    if (usingFirebase && db) {
      try {
        await deleteDoc(doc(db, "debts", id));
      } catch (e) {
        const updated = debts.filter(d => d.id !== id);
        setDebts(updated);
        saveToLocal(updated);
      }
    } else {
      const updated = debts.filter(d => d.id !== id);
      setDebts(updated);
      saveToLocal(updated);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <p className="text-slate-600 font-medium italic animate-pulse-soft">Đang kết nối Firestore...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isCloud={usingFirebase} firebaseError={firebaseError} />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen">
        {firebaseError && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div>
                <p className="text-amber-800 font-bold text-sm">Chế độ đồng bộ gặp lỗi</p>
                <p className="text-amber-700 text-xs">{firebaseError}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">
                {activeTab === 'dashboard' && 'Tổng quan'}
                {activeTab === 'debts' && 'Khoản nợ'}
                {activeTab === 'history' && 'Lịch sử'}
                {activeTab === 'ai' && 'AI Advisor'}
              </h1>
              <div className={`w-3 h-3 rounded-full ${usingFirebase ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-amber-500'}`}></div>
            </div>
            <p className="text-slate-500 text-sm">
              {usingFirebase ? 'Dữ liệu đang được đồng bộ hóa với Cloud.' : 'Đang sử dụng bộ nhớ trình duyệt (Offline).'}
            </p>
          </div>
          <button 
            onClick={() => { setEditingDebt(undefined); setIsFormOpen(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl transition-all shadow-xl hover:shadow-indigo-200 flex items-center gap-2 font-bold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            TẠO KHOẢN NỢ
          </button>
        </header>

        {activeTab === 'dashboard' && <Dashboard stats={stats} debts={debts} onRecordPayment={setPayingDebt} />}
        {activeTab === 'debts' && (
          <DebtList 
            debts={debts.filter(d => d.status !== DebtStatus.PAID)} 
            onDelete={handleDeleteDebt} 
            onEdit={(debt) => { setEditingDebt(debt); setIsFormOpen(true); }}
            onRecordPayment={setPayingDebt}
          />
        )}
        {activeTab === 'history' && <PaidDebtList debts={debts.filter(d => d.status === DebtStatus.PAID)} onDelete={handleDeleteDebt} />}
        {activeTab === 'ai' && <AIInsights debts={debts} />}

        {isFormOpen && (
          <DebtForm 
            onClose={() => { setIsFormOpen(false); setEditingDebt(undefined); }} 
            onSubmit={handleAddOrUpdateDebt}
            initialData={editingDebt}
          />
        )}

        {payingDebt && (
          <PaymentForm 
            debt={payingDebt}
            onClose={() => setPayingDebt(undefined)}
            onSubmit={handleRecordPayment}
          />
        )}
      </main>
    </div>
  );
};

export default App;
