const db = require('../config/db');

// Helper: Calculate sums for a given date window
async function getWindowTotals(startDate, endDate) {
  let query = db('transactions');

  if (startDate && endDate) {
    query = query.whereBetween('date', [startDate, endDate]);
  }

  const totals = await query
    .select('type')
    .sum('amount as total')
    .groupBy('type');

  const incomeRow = totals.find((t) => t.type === 'income');
  const expenseRow = totals.find((t) => t.type === 'expense');

  const totalIncome = incomeRow ? Number(incomeRow.total) : 0;
  const totalExpenses = expenseRow ? Number(expenseRow.total) : 0;
  const net = totalIncome - totalExpenses;
  const marginPct = totalIncome > 0 ? Number(((net / totalIncome) * 100).toFixed(1)) : 0;

  return { totalIncome, totalExpenses, net, marginPct };
}

// Helper: Safely calculate percentage change (delta) avoiding division by zero
function calculateDelta(current, previous) {
  if (previous === 0) {
    return current !== 0 ? 100 : 0;
  }
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
}

const summaryService = {
  async getDashboardSummary(currentWindow, compareWindow) {
    // 1. Current Period Totals
    const current = await getWindowTotals(currentWindow?.startDate, currentWindow?.endDate);

    // 2. Comparison Period Totals (if comparison range provided)
    let deltas = { income: 0, expenses: 0, net: 0, margin: 0 };

    if (compareWindow?.startDate && compareWindow?.endDate) {
      const previous = await getWindowTotals(compareWindow.startDate, compareWindow.endDate);

      deltas = {
        income: calculateDelta(current.totalIncome, previous.totalIncome),
        expenses: calculateDelta(current.totalExpenses, previous.totalExpenses),
        net: calculateDelta(current.net, previous.net),
        margin: Number((current.marginPct - previous.marginPct).toFixed(1)),
      };
    }

    return {
      totalIncome: current.totalIncome,
      totalExpenses: current.totalExpenses,
      net: current.net,
      marginPct: current.marginPct,
      deltas,
    };
  },
};

module.exports = summaryService;