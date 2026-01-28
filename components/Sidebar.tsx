
import React from 'react';

interface SidebarProps {
  activeTab: 'dashboard' | 'debts' | 'ai' | 'history';
  setActiveTab: (tab: 'dashboard' | 'debts' | 'ai' | 'history') => void;
  isCloud?: boolean;
  firebaseError?: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isCloud = false, firebaseError }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
    )},
    { id: 'debts', label: 'Khoản nợ', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    )},
    { id: 'history', label: 'Lịch sử trả xong', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    )},
    { id: 'ai', label: 'AI Advisor', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8M16 4h-4M12 12v4M12 16H8M16 16h-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9Z"/><path d="M12 12h.01"/></svg>
    )}
  ];

  return (
    <aside className="w-20 md:w-64 bg-white border-r border-slate-200 flex flex-col items-center md:items-stretch h-screen sticky top-0 transition-all">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-100">SD</div>
        <span className="hidden md:block text-xl font-bold text-slate-800 tracking-tight">SmartDebt</span>
      </div>
      
      <nav className="mt-8 flex-1 px-3 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === item.id 
                ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-100' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            {item.icon}
            <span className="hidden md:block text-left">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 mb-4 hidden md:block">
        <div className={`rounded-2xl p-4 border transition-colors ${isCloud ? 'bg-emerald-50 border-emerald-100' : firebaseError ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${isCloud ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,1)]' : firebaseError ? 'bg-red-500' : 'bg-amber-500'}`}></div>
            <p className={`text-[10px] uppercase font-bold tracking-wider ${isCloud ? 'text-emerald-600' : firebaseError ? 'text-red-600' : 'text-amber-600'}`}>
              {isCloud ? 'Cloud Connected' : firebaseError ? 'Sync Error' : 'Local Mode'}
            </p>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            {isCloud 
              ? 'Dữ liệu đã an toàn. Hãy nhớ thiết lập Rules bảo mật trên Console.' 
              : firebaseError 
              ? 'Vui lòng kiểm tra lại cấu hình Firestore Database.' 
              : 'Dùng Local Storage. Dữ liệu có thể mất nếu xóa cache trình duyệt.'}
          </p>
          {firebaseError && (
            <a 
              href="https://console.firebase.google.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-2 block text-[10px] text-red-600 font-bold underline uppercase"
            >
              Mở Firebase Console
            </a>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
