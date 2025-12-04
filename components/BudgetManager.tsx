import React, { useState, useEffect } from 'react';
import { Clock, Save, Trash2, RefreshCw, AlertCircle, Edit, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Portfolio, BudgetSchedule } from '../types';
import { runBudgetMonitorLogic } from '../services/budgetService';

interface BudgetManagerProps {
  portfolios: Portfolio[]; // Already filtered by account in parent
  schedules: BudgetSchedule[];
  onUpdatePortfolios: (ps: Portfolio[]) => void;
  onUpdateSchedules: (s: BudgetSchedule[]) => void;
}

const DAYS_MAP = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const BudgetManager: React.FC<BudgetManagerProps> = ({ portfolios, schedules, onUpdatePortfolios, onUpdateSchedules }) => {
  const [editingPortfolioId, setEditingPortfolioId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  // New Schedule Form State
  const [newName, setNewName] = useState('');
  const [newCap, setNewCap] = useState(100);
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('17:00');
  const [newDays, setNewDays] = useState<number[]>([1,2,3,4,5]);

  // Simulation State
  const [simulatedTime, setSimulatedTime] = useState<Date>(new Date());
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);

  const activePortfolio = portfolios.find(p => p.id === editingPortfolioId);
  const activeSchedules = schedules.filter(s => s.portfolioId === editingPortfolioId);

  // --- Handlers ---

  const handleToggleDayparting = (portfolioId: string, currentStatus: boolean) => {
    // Update the specific portfolio in the parent list
    const updated = portfolios.map(p => 
      p.id === portfolioId ? { ...p, isDaypartingEnabled: !currentStatus } : p
    );
    // Note: In a real app we would update the "master" list. 
    // Since props.portfolios is filtered, the parent needs to handle merging this back to the main state.
    // The parent's onUpdatePortfolios expects a full list or handled correctly. 
    // Assuming parent handles merging or we pass the modified subset and parent merges by ID.
    onUpdatePortfolios(updated);
  };

  const handleCreateSchedule = () => {
    if (!editingPortfolioId) return;
    const newSchedule: BudgetSchedule = {
      id: Math.random().toString(36).substr(2, 9),
      portfolioId: editingPortfolioId,
      name: newName || 'Untitled Schedule',
      scheduledBudgetCap: newCap,
      startTimeUtc: newStart,
      endTimeUtc: newEnd,
      daysOfWeek: newDays,
      isActive: true,
    };
    onUpdateSchedules([...schedules, newSchedule]);
    setNewName('');
  };

  const handleDeleteSchedule = (id: string) => {
    onUpdateSchedules(schedules.filter(s => s.id !== id));
  };

  const toggleDay = (dayIndex: number) => {
    if (newDays.includes(dayIndex)) {
      setNewDays(newDays.filter(d => d !== dayIndex));
    } else {
      setNewDays([...newDays, dayIndex].sort());
    }
  };

  // --- Simulation Logic ---

  const runSimulationStep = () => {
    // We only simulate for the portfolios currently passed in (the active account's portfolios)
    const { updatedPortfolios, logs: newLogs } = runBudgetMonitorLogic(portfolios, schedules, simulatedTime);
    
    // Check if any changed
    let hasChanges = false;
    updatedPortfolios.forEach((p) => {
        const original = portfolios.find(op => op.id === p.id);
        if (original && original.currentBudgetCap !== p.currentBudgetCap) {
            hasChanges = true;
        }
    });

    if (hasChanges) {
        onUpdatePortfolios(updatedPortfolios);
    }
    if (newLogs.length > 0) {
        setLogs(prev => [...newLogs, ...prev].slice(0, 50));
    }
  };

  useEffect(() => {
    runSimulationStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulatedTime]);

  useEffect(() => {
    let interval: any;
    if (isAutoSimulating) {
      interval = setInterval(() => {
        setSimulatedTime(prev => {
          const next = new Date(prev);
          next.setMinutes(next.getMinutes() + 15);
          return next;
        });
      }, 1000); 
    }
    return () => clearInterval(interval);
  }, [isAutoSimulating]);

  // --- Views ---

  const renderPortfolioList = () => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">Campaign Portfolios</h2>
            <span className="text-sm text-slate-500">{portfolios.length} Portfolios found</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                    <tr>
                        <th className="px-6 py-4">Portfolio Name</th>
                        <th className="px-6 py-4">Marketplace</th>
                        <th className="px-6 py-4">Default Cap</th>
                        <th className="px-6 py-4">Current Cap</th>
                        <th className="px-6 py-4">Dayparting</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {portfolios.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                            <td className="px-6 py-4 text-slate-500">{p.marketplace}</td>
                            <td className="px-6 py-4 text-slate-500">${p.defaultBudgetCap}</td>
                            <td className="px-6 py-4">
                                <span className={`font-bold ${p.currentBudgetCap !== p.defaultBudgetCap ? 'text-brand-600' : 'text-slate-700'}`}>
                                    ${p.currentBudgetCap}
                                </span>
                                {p.currentBudgetCap !== p.defaultBudgetCap && (
                                    <span className="ml-2 text-[10px] bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded uppercase font-bold">Override</span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                <button 
                                    onClick={() => handleToggleDayparting(p.id, p.isDaypartingEnabled)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                        p.isDaypartingEnabled 
                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                                >
                                    {p.isDaypartingEnabled ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                    {p.isDaypartingEnabled ? 'Enabled' : 'Disabled'}
                                </button>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button 
                                    disabled={!p.isDaypartingEnabled}
                                    onClick={() => setEditingPortfolioId(p.id)}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        p.isDaypartingEnabled
                                        ? 'bg-brand-50 text-brand-600 hover:bg-brand-100'
                                        : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                                    }`}
                                >
                                    <Edit size={16} />
                                    Manage Rules
                                </button>
                            </td>
                        </tr>
                    ))}
                    {portfolios.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                No portfolios found for this account.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );

  const renderEditor = () => {
    if (!activePortfolio) return null;

    return (
        <div className="space-y-6">
            <button 
                onClick={() => setEditingPortfolioId(null)}
                className="flex items-center text-slate-500 hover:text-slate-800 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Portfolios
            </button>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Managing: {activePortfolio.name}</h2>
                    <p className="text-slate-500 text-sm">Marketplace: {activePortfolio.marketplace} • Default Cap: ${activePortfolio.defaultBudgetCap}</p>
                </div>
                <div className="text-left md:text-right">
                    <span className="block text-xs text-slate-400 uppercase">Current Real-time Cap</span>
                    <span className="text-2xl font-bold text-brand-600">${activePortfolio.currentBudgetCap}</span>
                </div>
            </div>

            {/* Editor Columns - Stack on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Left: Create Rule */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <Clock className="w-5 h-5 mr-2 text-brand-500" />
                            Create Schedule
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" placeholder="e.g. Morning Rush" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Override Budget ($)</label>
                                <input type="number" value={newCap} onChange={e => setNewCap(Number(e.target.value))} className="w-full border rounded px-3 py-2 text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Start (UTC)</label>
                                    <input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">End (UTC)</label>
                                    <input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-2">Days</label>
                                <div className="flex gap-1.5 flex-wrap">
                                    {DAYS_MAP.map((day, idx) => (
                                    <button
                                        key={day}
                                        onClick={() => toggleDay(idx)}
                                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                                        newDays.includes(idx) ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-400'
                                        }`}
                                    >
                                        {day}
                                    </button>
                                    ))}
                                </div>
                            </div>
                            <button onClick={handleCreateSchedule} className="w-full bg-slate-800 text-white py-2 rounded-lg font-medium flex justify-center items-center gap-2">
                                <Save className="w-4 h-4" /> Add Rule
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Active List */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Schedules</h3>
                    {activeSchedules.length === 0 && <div className="text-slate-400 text-sm italic">No schedules active.</div>}
                    {activeSchedules.map(s => (
                        <div key={s.id} className="bg-white p-4 rounded-lg border border-slate-200 flex justify-between items-center group">
                            <div>
                                <div className="font-bold text-slate-700">{s.name}</div>
                                <div className="text-xs text-slate-500 mt-1">{s.startTimeUtc} - {s.endTimeUtc} UTC • <span className="text-brand-600 font-bold">${s.scheduledBudgetCap}</span></div>
                                <div className="text-xs text-slate-400 mt-1">{s.daysOfWeek.map(d => DAYS_MAP[d]).join(', ')}</div>
                            </div>
                            <button onClick={() => handleDeleteSchedule(s.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dayparting Manager</h1>
        <p className="text-slate-500">Enable dayparting on portfolios and configure schedule rules.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Main Content Area */}
        <div className="xl:col-span-3 space-y-6">
             {editingPortfolioId ? renderEditor() : renderPortfolioList()}
        </div>

        {/* Sidebar: Simulation (Always visible for context) */}
        <div className="xl:col-span-1 space-y-6">
             <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg border border-slate-700">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <RefreshCw className={`w-5 h-5 ${isAutoSimulating ? 'animate-spin' : ''}`} />
                    Worker Simulation
                </h3>
                <div className="bg-slate-800 p-4 rounded-lg mb-6 text-center border border-slate-600">
                    <span className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Simulated Server Time (UTC)</span>
                    <span className="text-3xl font-mono font-bold text-brand-400">
                        {simulatedTime.toISOString().substr(11, 5)}
                    </span>
                    <span className="block text-xs text-slate-500 mt-1">
                        {DAYS_MAP[simulatedTime.getUTCDay()]}
                    </span>
                </div>
                <div className="space-y-3">
                    <button 
                        onClick={() => setIsAutoSimulating(!isAutoSimulating)}
                        className={`w-full py-2 rounded font-bold text-sm transition-colors ${
                            isAutoSimulating ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-500 hover:bg-brand-600'
                        }`}
                    >
                        {isAutoSimulating ? 'Stop' : 'Run Simulation'}
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                         <button onClick={() => { const d = new Date(simulatedTime); d.setHours(d.getHours() + 1); setSimulatedTime(d); }} className="bg-slate-700 hover:bg-slate-600 py-2 rounded text-xs">+1 Hour</button>
                         <button onClick={() => { const d = new Date(simulatedTime); d.setHours(d.getHours() - 1); setSimulatedTime(d); }} className="bg-slate-700 hover:bg-slate-600 py-2 rounded text-xs">-1 Hour</button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-[300px] flex flex-col">
                <h3 className="text-sm font-bold text-slate-700 mb-2 border-b pb-2">Worker Logs</h3>
                <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs">
                    {logs.length === 0 && <span className="text-slate-400">Waiting for activity...</span>}
                    {logs.map((log, i) => <div key={i} className="text-slate-600 border-l-2 border-slate-300 pl-2 py-1">{log}</div>)}
                </div>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                    <strong>Note:</strong> Logs simulate backend logic checking active rules against the server time.
                </p>
             </div>
        </div>

      </div>
    </div>
  );
};

export default BudgetManager;