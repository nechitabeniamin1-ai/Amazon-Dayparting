import { PerformanceData, Granularity, ChartDataPoint, AggregatedMetrics } from '../types';

/**
 * Aggregates raw daily performance data into Daily, Weekly, or Monthly buckets.
 * Automatically recalculates rates (ACoS, CTR, etc.) based on summed totals.
 */
export const aggregateDataByGranularity = (
  data: PerformanceData[], 
  granularity: Granularity
): ChartDataPoint[] => {
  const map = new Map<string, ChartDataPoint>();

  // Helper to get the key based on granularity
  const getKey = (dateStr: string): string => {
    const date = new Date(dateStr);
    
    if (granularity === 'MONTHLY') {
      // Key: YYYY-MM
      return dateStr.substring(0, 7); 
    } 
    
    if (granularity === 'WEEKLY') {
      // Key: Start of Week (Sunday)
      const day = date.getDay();
      const diff = date.getDate() - day; // adjust when day is sunday
      const startOfWeek = new Date(date);
      startOfWeek.setDate(diff);
      return startOfWeek.toISOString().split('T')[0];
    }

    // Default: DAILY
    return dateStr;
  };

  // Helper for label formatting (for sorting/display)
  const getLabel = (key: string): string => key; 

  data.forEach(d => {
    const key = getKey(d.date);
    
    if (!map.has(key)) {
      map.set(key, {
        date: key,
        spend: 0,
        sales: 0,
        ppcSales: 0,
        impressions: 0,
        clicks: 0,
        orders: 0,
        // Rates initialized to 0, calculated at end
        acos: 0,
        tacos: 0,
        ctr: 0,
        cvr: 0,
        cpc: 0,
      });
    }

    const entry = map.get(key)!;
    entry.spend += d.spend;
    entry.sales += d.totalSales;
    entry.ppcSales += d.ppcSales;
    entry.impressions += d.impressions;
    entry.clicks += d.clicks;
    // Estimate orders from mock data logic if not present (assuming $25 AOV as per mock gen)
    // In real app, orders would be in PerformanceData. 
    // We will infer orders from sales/25 for consistency with mock generator.
    entry.orders += (d.ppcSales / 25); 
  });

  // Convert map to array and calculate rates
  const result = Array.from(map.values()).map(entry => ({
    ...entry,
    acos: entry.ppcSales ? (entry.spend / entry.ppcSales) * 100 : 0,
    tacos: entry.sales ? (entry.spend / entry.sales) * 100 : 0,
    ctr: entry.impressions ? (entry.clicks / entry.impressions) * 100 : 0,
    cvr: entry.clicks ? (entry.orders / entry.clicks) * 100 : 0,
    cpc: entry.clicks ? entry.spend / entry.clicks : 0,
  }));

  // Sort by date
  return result.sort((a, b) => a.date.localeCompare(b.date));
};


/**
 * Calculates single summary metrics object from a list of data points
 */
export const calculateTotals = (data: PerformanceData[] | ChartDataPoint[]): AggregatedMetrics => {
  const totals = data.reduce((acc, curr) => ({
    impressions: acc.impressions + ('impressions' in curr ? curr.impressions : 0),
    clicks: acc.clicks + curr.clicks,
    spend: acc.spend + curr.spend,
    ppcSales: acc.ppcSales + curr.ppcSales,
    totalSales: acc.totalSales + ('totalSales' in curr ? curr.totalSales : (curr as any).sales),
  }), { impressions: 0, clicks: 0, spend: 0, ppcSales: 0, totalSales: 0 });

  return {
    ...totals,
    acos: totals.ppcSales ? (totals.spend / totals.ppcSales) * 100 : 0,
    tacos: totals.totalSales ? (totals.spend / totals.totalSales) * 100 : 0,
    ctr: totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0,
    cvr: totals.clicks ? ((totals.ppcSales / 25) / totals.clicks) * 100 : 0, // Approx
    ppcPercentOfSales: totals.totalSales ? (totals.ppcSales / totals.totalSales) * 100 : 0,
  };
};

export const formatDateLabel = (dateStr: string, granularity: Granularity): string => {
  const date = new Date(dateStr);
  if (granularity === 'MONTHLY') {
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }
  if (granularity === 'WEEKLY') {
    return `Week of ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};
