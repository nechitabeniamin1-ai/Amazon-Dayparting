import React from 'react';
import { Agent } from '../types';
import { Users, ArrowRight } from 'lucide-react';

interface LoginScreenProps {
  agents: Agent[];
  onSelectAgent: (agent: Agent) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ agents, onSelectAgent }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 bg-brand-600 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
             <span className="text-3xl font-bold text-white">A</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to AmzOptima</h1>
          <p className="text-brand-100">Select an agent profile to continue</p>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Available Profiles</p>
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => onSelectAgent(agent)}
              className="w-full flex items-center p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-md transition-all group bg-white hover:bg-brand-50/30"
            >
              <img 
                src={agent.avatarUrl} 
                alt={agent.name} 
                className="w-12 h-12 rounded-full border-2 border-slate-100 group-hover:border-brand-200 transition-colors"
              />
              <div className="ml-4 text-left flex-1">
                <h3 className="font-bold text-slate-800 group-hover:text-brand-700 transition-colors">{agent.name}</h3>
                <p className="text-sm text-slate-500">{agent.assignedAccountIds.length} Assigned Accounts</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-brand-500 transition-colors" />
            </button>
          ))}
          
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
             <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
               <Users className="w-3 h-3" />
               Simulated Authentication
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;