const budgetService = require('../services/budgetService');

const budgetController = {
  
  async getByYear(req, res) {
    try {
      const year = req.query.year || new Date().getFullYear();              // this is to GET /api/budgets?year=2026
      const budgets = await budgetService.getBudgetsByYear(year);

      return res.status(200).json({
        success: true,
        data: budgets,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve budgets',
        error: error.message,
      });
    }
  },

  
  async setBudget(req, res) {                                                     //this is to set for setting a budget - PUT /api/budgets
    try {
      const { category_id, year, amount } = req.body;

      if (!year || amount === undefined || amount < 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid year and non-negative amount are required.',
        });
      }

      const updatedBudgets = await budgetService.setBudget({
        category_id: category_id || null,
        year: Number(year),
        amount: Number(amount),
      });

      return res.status(200).json({
        success: true,
        data: updatedBudgets,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update budget',
        error: error.message,
      });
    }
  },
};

module.exports = budgetController;