import { BudgetSchedule, Portfolio } from '../types';

/**
 * CORE LOGIC FUNCTION: budget_monitor equivalent
 * 
 * In a real Python/Django backend, this would be a Celery task running every 5-15 mins.
 * It checks the 'BudgetSchedule' table and updates the Portfolio via Amazon API.
 */
export const runBudgetMonitorLogic = (
  portfolios: Portfolio[],
  schedules: BudgetSchedule[],
  simulatedTimeUtc?: Date 
): { updatedPortfolios: Portfolio[], logs: string[] } => {
  
  const now = simulatedTimeUtc || new Date();
  const logs: string[] = [];
  
  // Get current time components in UTC
  const currentUtcDay = now.getUTCDay(); // 0-6
  const currentUtcHours = now.getUTCHours();
  const currentUtcMinutes = now.getUTCMinutes();
  const currentTimeMinutes = currentUtcHours * 60 + currentUtcMinutes;

  const updatedPortfolios = portfolios.map(portfolio => {
    // 1. Find active schedules for this portfolio
    const portfolioSchedules = schedules.filter(s => s.portfolioId === portfolio.id && s.isActive);
    
    let activeOverride: BudgetSchedule | null = null;

    // 2. Check overlap
    for (const schedule of portfolioSchedules) {
      if (!schedule.daysOfWeek.includes(currentUtcDay)) continue;

      const [startH, startM] = schedule.startTimeUtc.split(':').map(Number);
      const [endH, endM] = schedule.endTimeUtc.split(':').map(Number);
      
      const startTimeMinutes = startH * 60 + startM;
      const endTimeMinutes = endH * 60 + endM;

      // Handle simple range (e.g. 09:00 to 17:00)
      // Note: This simple logic doesn't fully cover overnight ranges (e.g. 23:00 to 02:00) 
      // without extra date math, but suffices for this demo.
      if (currentTimeMinutes >= startTimeMinutes && currentTimeMinutes < endTimeMinutes) {
        activeOverride = schedule;
        break; // Priority to first match (or could use highest budget)
      }
    }

    // 3. Determine correct budget
    const correctBudget = activeOverride ? activeOverride.scheduledBudgetCap : portfolio.defaultBudgetCap;
    
    // 4. Mimic API Update
    if (correctBudget !== portfolio.currentBudgetCap) {
      logs.push(
        `[${now.toISOString()}] Portfolio "${portfolio.name}": Changed budget from $${portfolio.currentBudgetCap} to $${correctBudget} (${activeOverride ? `Schedule: ${activeOverride.name}` : 'Reverting to Default'})`
      );
      return { ...portfolio, currentBudgetCap: correctBudget };
    }

    return portfolio;
  });

  return { updatedPortfolios, logs };
};
