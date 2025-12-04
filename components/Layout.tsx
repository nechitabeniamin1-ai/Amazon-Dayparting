import React from 'react';
import { LayoutDashboard, PieChart, Settings, LogOut, Search, Bell, ChevronDown, Store, FileText } from 'lucide-react';
import { Agent, AmazonAccount } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'budget' | 'report';
  setActiveTab: (tab: 'dashboard' | 'budget' | 'report') => void;
  currentUser: Agent;
  assignedAccounts: AmazonAccount[];
  selectedAccount: AmazonAccount | null;
  onSelectAccount: (account: AmazonAccount) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, setActiveTab, currentUser, 
  assignedAccounts, selectedAccount, onSelectAccount, onLogout 
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full z-10 transition-all no-print">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-xl">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">A</div>
            AmzOptima
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <div className="mb-6 px-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>
          </div>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-brand-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('budget')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'budget' ? 'bg-brand-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <PieChart size={20} />
            Dayparting Manager
          </button>
          <button 
            onClick={() => setActiveTab('report')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'report' ? 'bg-brand-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <FileText size={20} />
            Client Report
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-8 h-8 rounded-full border border-slate-600" />
            <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-800 text-slate-400 text-sm transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-8 flex items-center justify-between no-print">
          
          {/* Account Selector */}
          <div className="flex items-center gap-4">
            <div className="relative group">
                <button className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-lg transition-colors">
                    <Store className="w-4 h-4 text-slate-500" />
                    <div className="text-left">
                        <p className="text-xs text-slate-400 font-medium">Active Account</p>
                        <p className="text-sm font-bold text-slate-800 leading-none">
                          {selectedAccount?.name || 'Select Account'} <span className="text-xs text-slate-400 font-normal">({selectedAccount?.marketplaceCode})</span>
                        </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />
                </button>
                {/* Dropdown */}
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 hidden group-hover:block z-50">
                    <div className="p-2">
                        {assignedAccounts.map(account => (
                            <button
                                key={account.id}
                                onClick={() => onSelectAccount(account)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1 flex justify-between items-center ${
                                    selectedAccount?.id === account.id ? 'bg-brand-50 text-brand-700 font-bold' : 'hover:bg-slate-50 text-slate-600'
                                }`}
                            >
                                <span>{account.name}</span>
                                <span className="text-xs bg-slate-100 text-slate-500 px-1.5 rounded">{account.marketplaceCode}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
            </div>
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto min-w-0">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;