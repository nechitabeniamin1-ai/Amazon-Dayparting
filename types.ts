// --- Database Schema Equivalents ---

export interface Agent {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  assignedAccountIds: string[]; // IDs of AmazonAccounts this agent can access
}

export interface AmazonAccount {
  id: string;
  name: string;
  sellerId: string;
  marketplaceCode: string; // e.g., US, UK, DE
  currency: string;
}

export interface Portfolio {
  id: string;
  amazonAccountId: string; // Link to specific amazon account
  name: string;
  defaultBudgetCap: number;
  currentBudgetCap: number; // The active value (changed by worker)
  marketplace: string;
  isDaypartingEnabled: boolean; // Feature toggle per portfolio
}

export interface BudgetSchedule {
  id: string;
  portfolioId: string;
  name: string;
  scheduledBudgetCap: number;
  startTimeUtc: string; // HH:mm format (UTC)
  endTimeUtc: string;   // HH:mm format (UTC)
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, etc.
  isActive: boolean;
}

export interface PerformanceData {
  date: string; // ISO Date YYYY-MM-DD
  amazonAccountId: string; // Link data to account
  campaignId: string;
  campaignName: string;
  portfolioId: string;
  impressions: number;
  clicks: number;
  spend: number;
  ppcSales: number;
  totalSales: number;
}

// --- Frontend Helper Types ---

export interface AggregatedMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  ppcSales: number;
  totalSales: number;
  acos: number;
  tacos: number;
  ctr: number;
  cvr: number;
  ppcPercentOfSales: number;
}

export enum DateRangeOption {
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_30_DAYS = 'LAST_30_DAYS',
  THIS_MONTH = 'THIS_MONTH',
}

export type Granularity = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface ChartDataPoint {
  date: string;
  spend: number;
  sales: number;
  ppcSales: number;
  impressions: number;
  clicks: number;
  orders: number; // Derived or estimated
  acos: number;
  tacos: number;
  ctr: number;
  cvr: number;
  cpc: number;
}