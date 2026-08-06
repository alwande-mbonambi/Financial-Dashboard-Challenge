const budgetService = require('../services/budgetService');
const { ApiError } = require('../utils/ApiError');

const budgetController = {
  
  async getByYear(req, res, next) {
    try {
      const year = Number(req.query.year) || new Date().getFullYear();          //GET     // this is to get the budget for a specific year, defaulting to the current year if not provided
      const budgets = await budgetService.getBudgetsByYear(year);

      return res.status(200).json({
        success: true,
        data: budgets,
      });
    } catch (error) {
      next(error);
    }
    
  },

  
  async setBudget(req, res, next) {                                                     //this is to set for setting a budget - PUT /api/budgets
    try {
      const { category_id, year, amount } = req.body;

      if (!year || amount === undefined || amount < 0) {
        throw new ApiError(400, 'Valid year and non-negative amount are required.', 'VALIDATION_ERROR');
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
      next(error);
    }
  },

  
  async deleteBudget(req, res, next) {                                                                    // DELETE /api/budgets?year=2026&categoryId=3
    try {
      const { year, categoryId } = req.query;

      if (!year) {
        throw new ApiError(400, 'Year query parameter is required.', 'VALIDATION_ERROR');
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
        next(error);
    }
  },
};

module.exports = budgetController;