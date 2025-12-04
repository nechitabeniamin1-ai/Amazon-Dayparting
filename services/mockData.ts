import { PerformanceData, Portfolio, BudgetSchedule, Agent, AmazonAccount } from '../types';

// --- Agents ---
export const AGENTS: Agent[] = [
  {
    id: 'agent1',
    name: 'Stefan',
    email: 'Stefan@insiders.agency',
    avatarUrl: 'https://ui-avatars.com/api/?name=Stefan&background=0ea5e9&color=fff',
    assignedAccountIds: ['acc1', 'acc2'],
  },
  {
    id: 'agent2',
    name: 'Radu',
    email: 'Radu@insiders.agency',
    avatarUrl: 'https://ui-avatars.com/api/?name=Radu&background=f59e0b&color=fff',
    assignedAccountIds: ['acc2', 'acc3'],
  },
];

// --- Amazon Accounts ---
export const ACCOUNTS: AmazonAccount[] = [
  { id: 'acc1', name: 'Alpha Brands US', sellerId: 'A123XYZ', marketplaceCode: 'US', currency: 'USD' },
  { id: 'acc2', name: 'Alpha Brands UK', sellerId: 'B456ABC', marketplaceCode: 'UK', currency: 'GBP' },
  { id: 'acc3', name: 'Omega Gadgets', sellerId: 'C789DEF', marketplaceCode: 'US', currency: 'USD' },
];

// --- Portfolios ---
export const PORTFOLIOS: Portfolio[] = [
  // Account 1 (US)
  { id: 'p1', amazonAccountId: 'acc1', name: 'Summer Clothing Launch', defaultBudgetCap: 500, currentBudgetCap: 500, marketplace: 'US', isDaypartingEnabled: true },
  { id: 'p2', amazonAccountId: 'acc1', name: 'Kitchen Gadgets Core', defaultBudgetCap: 1200, currentBudgetCap: 1200, marketplace: 'US', isDaypartingEnabled: true },
  
  // Account 2 (UK)
  { id: 'p3', amazonAccountId: 'acc2', name: 'Pet Supplies - UK', defaultBudgetCap: 300, currentBudgetCap: 300, marketplace: 'UK', isDaypartingEnabled: false },
  { id: 'p4', amazonAccountId: 'acc2', name: 'Home Decor - UK', defaultBudgetCap: 450, currentBudgetCap: 450, marketplace: 'UK', isDaypartingEnabled: false },

  // Account 3 (US)
  { id: 'p5', amazonAccountId: 'acc3', name: 'Tech Accessories', defaultBudgetCap: 2000, currentBudgetCap: 2000, marketplace: 'US', isDaypartingEnabled: true },
];

// --- Schedules ---
export const SCHEDULES: BudgetSchedule[] = [
  {
    id: 's1',
    portfolioId: 'p1',
    name: 'Morning Rush Boost',
    scheduledBudgetCap: 1000,
    startTimeUtc: '13:00', // 9 AM EST
    endTimeUtc: '17:00',   // 1 PM EST
    daysOfWeek: [1, 2, 3, 4, 5],
    isActive: true,
  },
  {
    id: 's2',
    portfolioId: 'p2',
    name: 'Weekend Warrior',
    scheduledBudgetCap: 2000,
    startTimeUtc: '00:00',
    endTimeUtc: '23:59',
    daysOfWeek: [0, 6],
    isActive: true,
  },
  {
    id: 's3',
    portfolioId: 'p5',
    name: 'Evening Prime Time',
    scheduledBudgetCap: 3500,
    startTimeUtc: '22:00',
    endTimeUtc: '02:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    isActive: true,
  }
];

// --- Performance Data Generation ---
const generatePerformanceData = (): PerformanceData[] => {
  const data: PerformanceData[] = [];
  const today = new Date();
  
  // Generate last 100 days of data (increased from 60 for 3-month reports)
  for (let i = 100; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // For each portfolio, generate some campaigns
    PORTFOLIOS.forEach(portfolio => {
        // Random number of campaigns per portfolio
        const campaignCount = 2; 

        for (let c = 1; c <= campaignCount; c++) {
            const isWeekEnd = date.getDay() === 0 || date.getDay() === 6;
            const baseImpressions = 1000 + Math.random() * 5000;
            const multiplier = isWeekEnd ? 1.2 : 1.0;
            
            const impressions = Math.floor(baseImpressions * multiplier);
            const clicks = Math.floor(impressions * (0.005 + Math.random() * 0.01)); 
            const cpc = 0.8 + Math.random() * 0.5;
            const spend = clicks * cpc;
            const orders = Math.floor(clicks * (0.05 + Math.random() * 0.10)); 
            const aov = 25 + Math.random() * 10;
            const ppcSales = orders * aov;
            const organicSales = ppcSales * (0.5 + Math.random() * 1.5);

            data.push({
                date: dateStr,
                amazonAccountId: portfolio.amazonAccountId,
                portfolioId: portfolio.id,
                campaignId: `c_${portfolio.id}_${c}`,
                campaignName: `${portfolio.name} - Campaign ${c}`,
                impressions,
                clicks,
                spend: parseFloat(spend.toFixed(2)),
                ppcSales: parseFloat(ppcSales.toFixed(2)),
                totalSales: parseFloat((ppcSales + organicSales).toFixed(2)),
            });
        }
    });
  }
  return data;
};

export const MOCK_PERFORMANCE_DATA = generatePerformanceData();