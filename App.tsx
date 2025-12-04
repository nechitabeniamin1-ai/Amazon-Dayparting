import React, { useState, useMemo, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import BudgetManager from './components/BudgetManager';
import LoginScreen from './components/LoginScreen';
import ClientReport from './components/ClientReport';
import { 
  MOCK_PERFORMANCE_DATA, 
  PORTFOLIOS as INITIAL_PORTFOLIOS, 
  SCHEDULES as INITIAL_SCHEDULES,
  AGENTS,
  ACCOUNTS
} from './services/mockData';
import { Portfolio, BudgetSchedule, Agent, AmazonAccount } from './types';

const App: React.FC = () => {
  // --- Global App State ---
  const [currentUser, setCurrentUser] = useState<Agent | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<AmazonAccount | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'budget' | 'report'>('dashboard');
  
  // Data State (Simulating Database)
  const [portfolios, setPortfolios] = useState<Portfolio[]>(INITIAL_PORTFOLIOS);
  const [schedules, setSchedules] = useState<BudgetSchedule[]>(INITIAL_SCHEDULES);

  // --- Derived State ---
  
  // Get accounts assigned to current user
  const assignedAccounts = useMemo(() => {
    if (!currentUser) return [];
    return ACCOUNTS.filter(acc => currentUser.assignedAccountIds.includes(acc.id));
  }, [currentUser]);

  // Set default account on login
  useEffect(() => {
    if (currentUser && assignedAccounts.length > 0 && !selectedAccount) {
        setSelectedAccount(assignedAccounts[0]);
    }
  }, [currentUser, assignedAccounts, selectedAccount]);

  // Filter Data based on Selected Account
  const filteredPortfolios = useMemo(() => {
    if (!selectedAccount) return [];
    return portfolios.filter(p => p.amazonAccountId === selectedAccount.id);
  }, [portfolios, selectedAccount]);

  const filteredSchedules = useMemo(() => {
    const portfolioIds = filteredPortfolios.map(p => p.id);
    return schedules.filter(s => portfolioIds.includes(s.portfolioId));
  }, [schedules, filteredPortfolios]);

  const filteredPerformanceData = useMemo(() => {
    if (!selectedAccount) return [];
    return MOCK_PERFORMANCE_DATA.filter(d => d.amazonAccountId === selectedAccount.id);
  }, [selectedAccount]);

  // --- Handlers ---
  
  const handleUpdatePortfolios = (updatedFilteredList: Portfolio[]) => {
    // Merge filtered updates back into main list
    setPortfolios(prev => {
      const map = new Map(prev.map(p => [p.id, p]));
      updatedFilteredList.forEach(p => map.set(p.id, p));
      return Array.from(map.values());
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedAccount(null);
  };

  // --- Render ---

  if (!currentUser) {
    return <LoginScreen agents={AGENTS} onSelectAgent={setCurrentUser} />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      currentUser={currentUser}
      assignedAccounts={assignedAccounts}
      selectedAccount={selectedAccount}
      onSelectAccount={setSelectedAccount}
      onLogout={handleLogout}
    >
      {selectedAccount ? (
        <>
          {activeTab === 'dashboard' && (
            <Dashboard data={filteredPerformanceData} />
          )}
          {activeTab === 'budget' && (
            <BudgetManager 
              portfolios={filteredPortfolios}
              schedules={schedules}
              onUpdatePortfolios={handleUpdatePortfolios}
              onUpdateSchedules={setSchedules}
            />
          )}
          {activeTab === 'report' && (
            <ClientReport 
              data={filteredPerformanceData} 
              account={selectedAccount} 
            />
          )}
        </>
      ) : (
        <div className="flex h-[80vh] items-center justify-center text-slate-400">
            Please select an account to view data.
        </div>
      )}
    </Layout>
  );
};

export default App;