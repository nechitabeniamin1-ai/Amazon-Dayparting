import React, { useMemo, useState } from 'react';
import { 
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area 
} from 'recharts';
import { Printer, Calendar, Settings2, Check } from 'lucide-react';
import { PerformanceData, AmazonAccount, Granularity } from '../types';
import { aggregateDataByGranularity, calculateTotals, formatDateLabel } from '../services/dataUtils';

interface ClientReportProps {
  data: PerformanceData[];
  account: AmazonAccount;
}

type KpiScope = 'LAST_3_MONTHS' | 'LAST_COMPLETE_MONTH';

const ClientReport: React.FC<ClientReportProps> = ({ data, account }) => {
  // State for View Configuration
  const [granularity, setGranularity] = useState<Granularity>('WEEKLY');
  const [kpiScope, setKpiScope] = useState<KpiScope>('LAST_COMPLETE_MONTH');

  // 1. Data Processing for Charts (Always Last 3 Months approx 90 days)
  const reportData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    // Sort ascending
    return data
      .filter(d => new Date(d.date) >= cutoff)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  // Aggregated Chart Data
  const chartData = useMemo(() => {
    return aggregateDataByGranularity(reportData, granularity);
  }, [reportData, granularity]);

  // 2. Data Processing for KPIs (Executive Summary)
  const kpiData = useMemo(() => {
    if (kpiScope === 'LAST_3_MONTHS') {
      return reportData;
    } 
    // Logic for Last Complete Month
    // Find the most recent "full month".
    // For simplicity in mock data, we'll take the calendar month prior to today.
    const today = new Date();
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    
    return reportData.filter(d => {
        const date = new Date(d.date);
        return date >= lastMonthStart && date <= lastMonthEnd;
    });
  }, [reportData, kpiScope]);

  // Totals for Executive Summary
  const totals = useMemo(() => {
    return calculateTotals(kpiData);
  }, [kpiData]);

  const kpis = {
    acos: totals.acos,
    tacos: totals.tacos,
    roas: totals.spend ? totals.ppcSales / totals.spend : 0,
    cpc: totals.cpc || (totals.clicks ? totals.spend / totals.clicks : 0),
    ctr: totals.ctr,
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: account.currency }).format(val);

  // --- Render Helpers ---

  const PrintHeader = () => (
    <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b-2 border-slate-800 pb-6 mb-8 gap-4">
        <div>
            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-brand-600 text-white rounded flex items-center justify-center font-bold">A</div>
                <span className="text-xl font-bold text-slate-800 tracking-tight">AmzOptima Reports</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Performance Report</h1>
            <p className="text-slate-500 mt-1">Generated for: <span className="font-semibold text-slate-700">{account.name}</span> ({account.marketplaceCode})</p>
        </div>
        <div className="md:text-right">
            <div className="flex md:justify-end items-center text-slate-500 text-sm mb-1">
                <Calendar className="w-4 h-4 mr-1" />
                <span>
                    {kpiScope === 'LAST_COMPLETE_MONTH' ? 'Summary: Last Month' : 'Summary: Last 3 Months'}
                </span>
            </div>
            <p className="font-mono text-xs text-slate-400">
               Charts Granularity: {granularity.charAt(0) + granularity.slice(1).toLowerCase()}
            </p>
        </div>
    </div>
  );

  const KpiBox = ({ label, value, sub, highlight = false }: any) => (
    <div className={`p-4 rounded-lg border ${highlight ? 'bg-brand-50 border-brand-200' : 'bg-white border-slate-200'}`}>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-2xl font-bold ${highlight ? 'text-brand-700' : 'text-slate-800'}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 bg-white min-h-screen">
      
      {/* Configuration Bar (Hidden on Print) */}
      <div className="no-print mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-200 pb-2">
            <Settings2 size={20} />
            Report Configuration
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* KPI Scope */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Executive Summary Scope</label>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setKpiScope('LAST_COMPLETE_MONTH')}
                        className={`flex-1 px-4 py-2 text-sm rounded-lg border flex items-center justify-center gap-2 ${
                            kpiScope === 'LAST_COMPLETE_MONTH' 
                            ? 'bg-brand-600 text-white border-brand-600 font-medium' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {kpiScope === 'LAST_COMPLETE_MONTH' && <Check size={14} />} Last Complete Month
                    </button>
                    <button 
                         onClick={() => setKpiScope('LAST_3_MONTHS')}
                         className={`flex-1 px-4 py-2 text-sm rounded-lg border flex items-center justify-center gap-2 ${
                            kpiScope === 'LAST_3_MONTHS' 
                            ? 'bg-brand-600 text-white border-brand-600 font-medium' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {kpiScope === 'LAST_3_MONTHS' && <Check size={14} />} Last 3 Months
                    </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 ml-1">
                    * Controls the numbers shown in the KPI cards below.
                </p>
            </div>

            {/* Chart Granularity */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Chart Visualization Granularity</label>
                 <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                    {(['DAILY', 'WEEKLY', 'MONTHLY'] as Granularity[]).map((g) => (
                        <button
                        key={g}
                        onClick={() => setGranularity(g)}
                        className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                            granularity === g 
                            ? 'bg-slate-800 text-white shadow-sm' 
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                        >
                        {g.charAt(0) + g.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
                 <p className="text-[10px] text-slate-400 mt-2 ml-1">
                    * Affects how data points are grouped in the charts.
                </p>
            </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200">
             <button 
                onClick={() => window.print()} 
                className="flex items-center gap-2 bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 transition-colors shadow-sm font-medium"
            >
                <Printer size={18} /> Print Report
            </button>
        </div>
      </div>

      <PrintHeader />

      {/* Executive Summary */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-slate-800 border-l-4 border-brand-500 pl-3 mb-4">
             Executive Summary
             <span className="text-sm font-normal text-slate-400 ml-2">
                ({kpiScope === 'LAST_COMPLETE_MONTH' ? 'Last Month' : 'Last 3 Months'})
             </span>
        </h2>
        {/* Responsive Grid: 2 cols on tablet, 4 on desktop/print */}
        <div className="grid grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-4 mb-6">
            <KpiBox label="Total Sales" value={formatCurrency(totals.totalSales)} sub="Organic + PPC" highlight />
            <KpiBox label="Ad Spend" value={formatCurrency(totals.spend)} sub={totals.totalSales ? `${(totals.spend / totals.totalSales * 100).toFixed(1)}% of Sales` : '0%'} />
            <KpiBox label="PPC Sales" value={formatCurrency(totals.ppcSales)} sub={totals.totalSales ? `${(totals.ppcSales / totals.totalSales * 100).toFixed(1)}% Contribution` : '0%'} />
            <KpiBox label="ROAS" value={`${kpis.roas.toFixed(2)}x`} sub="Return on Ad Spend" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-4">
             <KpiBox label="ACoS" value={`${kpis.acos.toFixed(2)}%`} sub="Efficiency Target" />
             <KpiBox label="CTR" value={`${kpis.ctr.toFixed(2)}%`} sub="Click Through Rate" />
             <KpiBox label="Avg. CPC" value={formatCurrency(kpis.cpc)} sub="Cost Per Click" />
             <KpiBox label="Impressions" value={(totals.impressions / 1000000).toFixed(2) + 'M'} sub="Total Visibility" />
        </div>
      </section>

      {/* 1. Spend vs Sales Chart */}
      <section className="mb-8 break-inside-avoid">
        <div className="mb-4">
            <h3 className="text-base font-bold text-slate-800 mb-1">Sales Performance & Ad Spend</h3>
            <p className="text-xs text-slate-500">Correlation between ad investment and total revenue generation (Last 3 Months).</p>
        </div>
        <div className="h-64 w-full border border-slate-100 rounded-lg p-2">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                        dataKey="date" 
                        tickFormatter={(d) => formatDateLabel(d, granularity)} 
                        tick={{fontSize: 10}} 
                        minTickGap={30} 
                        axisLine={false} 
                        tickLine={false} 
                    />
                    <YAxis yAxisId="left" tickFormatter={(v) => `$${v}`} tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <Tooltip 
                        labelFormatter={(d) => formatDateLabel(d, granularity)}
                        contentStyle={{ fontSize: '12px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                        formatter={(value: number) => [`$${Math.round(value)}`, '']} 
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                    <Area yAxisId="left" type="monotone" dataKey="sales" name="Total Sales" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth={2} />
                    <Bar yAxisId="left" dataKey="spend" name="Ad Spend" fill="#1e293b" barSize={granularity === 'MONTHLY' ? 40 : granularity === 'WEEKLY' ? 20 : 4} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
      </section>

      {/* Responsive Grid for charts: 1 col on mobile, 2 on desktop/print */}
      <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8 mb-8">
        
        {/* 2. Efficiency (ACoS) */}
        <section className="break-inside-avoid">
             <div className="mb-4">
                <h3 className="text-base font-bold text-slate-800 mb-1">Efficiency Trends (ACoS)</h3>
                <p className="text-xs text-slate-500">Advertising Cost of Sales over time.</p>
            </div>
            <div className="h-48 w-full border border-slate-100 rounded-lg p-2">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                        <CartesianGrid stroke="#f1f5f9" vertical={false} />
                        <XAxis 
                            dataKey="date" 
                            tickFormatter={(d) => formatDateLabel(d, granularity)} 
                            tick={{fontSize: 10}} 
                            minTickGap={30} 
                            axisLine={false} 
                            tickLine={false} 
                        />
                        <YAxis tickFormatter={(v) => `${v}%`} tick={{fontSize: 10}} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                        <Tooltip labelFormatter={(d) => formatDateLabel(d, granularity)} formatter={(v: number) => [`${v.toFixed(2)}%`, 'ACoS']} />
                        <Line type="monotone" dataKey="acos" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </section>

        {/* 3. Conversion Rate */}
        <section className="break-inside-avoid">
             <div className="mb-4">
                <h3 className="text-base font-bold text-slate-800 mb-1">Conversion Rate (CVR)</h3>
                <p className="text-xs text-slate-500">Percentage of clicks converting to orders.</p>
            </div>
            <div className="h-48 w-full border border-slate-100 rounded-lg p-2">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                        <CartesianGrid stroke="#f1f5f9" vertical={false} />
                        <XAxis 
                            dataKey="date" 
                            tickFormatter={(d) => formatDateLabel(d, granularity)} 
                            tick={{fontSize: 10}} 
                            minTickGap={30} 
                            axisLine={false} 
                            tickLine={false} 
                        />
                        <YAxis tickFormatter={(v) => `${v}%`} tick={{fontSize: 10}} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                        <Tooltip labelFormatter={(d) => formatDateLabel(d, granularity)} formatter={(v: number) => [`${v.toFixed(2)}%`, 'CVR']} />
                        <Line type="monotone" dataKey="cvr" stroke="#10b981" strokeWidth={2} dot={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </section>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8 mb-8">
        {/* 4. CPC Trends */}
        <section className="break-inside-avoid">
             <div className="mb-4">
                <h3 className="text-base font-bold text-slate-800 mb-1">Cost Per Click (CPC)</h3>
                <p className="text-xs text-slate-500">Average cost paid per click.</p>
            </div>
            <div className="h-48 w-full border border-slate-100 rounded-lg p-2">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                        <CartesianGrid stroke="#f1f5f9" vertical={false} />
                        <XAxis 
                            dataKey="date" 
                            tickFormatter={(d) => formatDateLabel(d, granularity)} 
                            tick={{fontSize: 10}} 
                            minTickGap={30} 
                            axisLine={false} 
                            tickLine={false} 
                        />
                        <YAxis tickFormatter={(v) => `$${v}`} tick={{fontSize: 10}} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                        <Tooltip labelFormatter={(d) => formatDateLabel(d, granularity)} formatter={(v: number) => [`$${v.toFixed(2)}`, 'CPC']} />
                        <Line type="monotone" dataKey="cpc" stroke="#6366f1" strokeWidth={2} dot={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </section>

        {/* 5. CTR Trends */}
        <section className="break-inside-avoid">
             <div className="mb-4">
                <h3 className="text-base font-bold text-slate-800 mb-1">Click Through Rate (CTR)</h3>
                <p className="text-xs text-slate-500">Ad relevance metric.</p>
            </div>
            <div className="h-48 w-full border border-slate-100 rounded-lg p-2">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                        <CartesianGrid stroke="#f1f5f9" vertical={false} />
                        <XAxis 
                            dataKey="date" 
                            tickFormatter={(d) => formatDateLabel(d, granularity)} 
                            tick={{fontSize: 10}} 
                            minTickGap={30} 
                            axisLine={false} 
                            tickLine={false} 
                        />
                        <YAxis tickFormatter={(v) => `${v}%`} tick={{fontSize: 10}} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                        <Tooltip labelFormatter={(d) => formatDateLabel(d, granularity)} formatter={(v: number) => [`${v.toFixed(2)}%`, 'CTR']} />
                        <Line type="monotone" dataKey="ctr" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </section>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400 gap-2">
        <p>© {new Date().getFullYear()} AmzOptima Analytics. Proprietary & Confidential.</p>
        <p>Report Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
      </div>

    </div>
  );
};

export default ClientReport;