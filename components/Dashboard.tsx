import React, { useMemo, useState } from 'react';
import { 
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Area 
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Sparkles, BarChart2, Calendar } from 'lucide-react';
import { PerformanceData, AggregatedMetrics, DateRangeOption, Granularity } from '../types';
import { generatePPCAnalysis } from '../services/geminiService';
import { aggregateDataByGranularity, calculateTotals, formatDateLabel } from '../services/dataUtils';

interface DashboardProps {
  data: PerformanceData[];
}

const MetricCard = ({ title, value, subtext, trend, prefix = '', suffix = '' }: any) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">{title}</h3>
    <div className="flex items-baseline space-x-2">
      <span className="text-3xl font-bold text-slate-800">{prefix}{value}{suffix}</span>
      {trend && (
        <span className={`text-sm font-medium flex items-center ${trend > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
          {trend > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-xs text-slate-400 mt-2">{subtext}</p>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [range, setRange] = useState<DateRangeOption>(DateRangeOption.LAST_30_DAYS);
  const [granularity, setGranularity] = useState<Granularity>('DAILY');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // 1. Filter Data based on Range
  const filteredData = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    
    // Reset hours to avoid timezone clipping issues for today's data
    now.setHours(23, 59, 59, 999);
    cutoff.setHours(0, 0, 0, 0);

    if (range === DateRangeOption.LAST_7_DAYS) cutoff.setDate(now.getDate() - 7);
    if (range === DateRangeOption.LAST_30_DAYS) cutoff.setDate(now.getDate() - 30);
    if (range === DateRangeOption.THIS_MONTH) cutoff.setDate(1); // 1st of month

    return data.filter(d => {
      const dDate = new Date(d.date);
      return dDate >= cutoff && dDate <= now;
    }).sort((a,b) => a.date.localeCompare(b.date));
  }, [data, range]);

  // 2. Aggregate for KPI Cards (Always totals of the filtered range)
  const metrics: AggregatedMetrics = useMemo(() => {
    return calculateTotals(filteredData);
  }, [filteredData]);

  // 3. Aggregate for Charts (Based on Granularity)
  const chartData = useMemo(() => {
    return aggregateDataByGranularity(filteredData, granularity);
  }, [filteredData, granularity]);

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    setAiAnalysis(null);
    const result = await generatePPCAnalysis(metrics, range);
    setAiAnalysis(result);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Header Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Performance Overview</h1>
          <p className="text-slate-500">Track your Amazon PPC efficiency and scale.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {/* Granularity Selector */}
          <div className="flex items-center bg-white rounded-lg shadow-sm border border-slate-200 p-1 overflow-x-auto">
             <div className="px-3 text-xs font-bold text-slate-400 uppercase flex items-center gap-1 border-r border-slate-100 mr-1 flex-shrink-0">
                <BarChart2 size={14} /> View By
             </div>
             {(['DAILY', 'WEEKLY', 'MONTHLY'] as Granularity[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                    granularity === g 
                    ? 'bg-slate-800 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {g.charAt(0) + g.slice(1).toLowerCase()}
                </button>
             ))}
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center bg-white rounded-lg shadow-sm border border-slate-200 p-1 overflow-x-auto">
            <div className="px-3 text-xs font-bold text-slate-400 uppercase flex items-center gap-1 border-r border-slate-100 mr-1 flex-shrink-0">
                <Calendar size={14} /> Range
             </div>
            {Object.values(DateRangeOption).map((opt) => (
              <button
                key={opt}
                onClick={() => setRange(opt)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  range === opt 
                  ? 'bg-brand-500 text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {opt.replace(/_/g, ' ').replace('LAST', '').trim()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Sales" 
          value={metrics.totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })} 
          prefix="$" 
          subtext="Combined Organic + PPC" 
          trend={-2.4} 
        />
        <MetricCard 
          title="Ad Spend" 
          value={metrics.spend.toLocaleString(undefined, { maximumFractionDigits: 0 })} 
          prefix="$" 
          subtext={`${metrics.clicks.toLocaleString()} Clicks`}
          trend={5.1} 
        />
        <MetricCard 
          title="ACoS" 
          value={metrics.acos.toFixed(2)} 
          suffix="%" 
          subtext="Target: 30%"
          trend={metrics.acos > 30 ? 1.2 : -0.5} 
        />
        <MetricCard 
          title="TaCOS" 
          value={metrics.tacos.toFixed(2)} 
          suffix="%" 
          subtext="Total Advertising Cost of Sales"
          trend={0.1} 
        />
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
          <h2 className="text-lg font-bold text-slate-800">Spend vs. Total Sales Analysis</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center"><span className="w-3 h-3 bg-brand-500 rounded-full mr-2"></span><span className="text-xs text-slate-500">Sales</span></div>
            <div className="flex items-center"><span className="w-3 h-3 bg-slate-800 rounded-full mr-2"></span><span className="text-xs text-slate-500">Spend</span></div>
            <div className="flex items-center"><span className="w-3 h-3 bg-amber-500 rounded-full mr-2"></span><span className="text-xs text-slate-500">ACoS</span></div>
          </div>
        </div>
        
        <div className="h-[300px] md:h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 0, bottom: 20, left: -20 }}>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                tickFormatter={(val) => {
                   const d = new Date(val);
                   if (granularity === 'MONTHLY') return d.toLocaleDateString(undefined, { month: 'short'});
                   return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric'});
                }}
              />
              <YAxis 
                yAxisId="left" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(val) => `$${val}`} 
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                labelFormatter={(label) => formatDateLabel(label, granularity)}
                formatter={(value: number, name: string) => [
                  name === 'acos' ? `${value.toFixed(2)}%` : `$${value.toLocaleString()}`, 
                  name === 'sales' ? 'Total Sales' : name === 'spend' ? 'Ad Spend' : 'ACoS'
                ]}
              />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="sales" 
                fill="url(#colorSales)" 
                stroke="#0ea5e9" 
                strokeWidth={2}
                fillOpacity={1} 
              />
              <Bar 
                yAxisId="left"
                dataKey="spend" 
                fill="#1e293b" 
                radius={[4, 4, 0, 0]} 
                barSize={granularity === 'MONTHLY' ? 40 : granularity === 'WEEKLY' ? 20 : 10} 
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="acos" 
                stroke="#f59e0b" 
                strokeWidth={2} 
                dot={false} 
              />
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

       {/* AI Analysis Section */}
       <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-indigo-900">AI Performance Analyst</h2>
          </div>
          <button 
            onClick={handleAiAnalysis}
            disabled={loadingAi}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingAi ? 'Analyzing...' : 'Generate Insights'}
          </button>
        </div>
        
        {aiAnalysis ? (
           <div className="prose prose-sm text-indigo-800 bg-white/60 p-4 rounded-lg">
             <ul className="list-disc pl-5 space-y-2" dangerouslySetInnerHTML={{ __html: aiAnalysis }} />
           </div>
        ) : (
          <p className="text-indigo-600/70 text-sm">
            Click the button to generate actionable insights using Google Gemini based on the current data view.
          </p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;