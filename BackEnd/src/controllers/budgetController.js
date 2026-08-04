const budgetService = require('../services/budgetService');

const budgetController = {
  
  async getByYear(req, res) {
    try {
      const year = Number(req.query.year) || new Date().getFullYear();          //GET     // this is to get the budget for a specific year, defaulting to the current year if not provided
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

  
async deleteBudget(req, res) {                                                                    // DELETE /api/budgets?year=2026&categoryId=3
  try {
    const { year, categoryId } = req.query;

    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Year query parameter is required.',
      });
    }

    const updatedBudgets = await budgetService.deleteBudget(
      Number(year),
      categoryId ? Number(categoryId) : null
    );

    return res.status(200).json({
      success: true,
      data: updatedBudgets,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete budget',
      error: error.message,
    });
  }
},
};

module.exports = budgetController;