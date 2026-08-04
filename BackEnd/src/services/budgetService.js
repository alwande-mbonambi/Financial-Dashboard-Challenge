const db = require('../config/db');

const budgetService = {
  
  async getBudgetsByYear(year) {                                                               // this is to get all budget targets for a specific year
    const budgets = await db('budgets')
      .leftJoin('categories', 'budgets.category_id', 'categories.id')      //.leftJoin means that it will return all records from the left table (budgets) and the matched records from the right table (categories). If there is no match, the result is NULL on the side of the right table which is categories in this case. I want to get all budget records, even if they don't have a corresponding category (for overall budgets).
      .where('budgets.year', year)
      .select(
        'budgets.id',
        'budgets.category_id',
        'budgets.year',
        'budgets.amount',
        'categories.name as category_name'
      );

    const overallBudgetRow = budgets.find((b) => b.category_id === null);                     //here im filtering the budgets array to find the overall budget (where category_id is null). This is important because the overall budget is not tied to any specific category   
    const categoryBudgets = budgets.filter((b) => b.category_id !== null);

    const categoryBudgetsTotal = categoryBudgets.reduce(                                   // this is to calculate the total of all category budgets for the year. It sums up the amount of each category budget to get a total figure for comparison against the overall budget.    .reduce((sum, b) => sum + Number(b.amount), 0);  // The second argument (0) initializes the sum to zero. This ensures that if there are no category budgets, the total will correctly be zero instead of undefined or causing an error.
      (sum, b) => sum + Number(b.amount),
      0
    );
    const yearlyBudget = overallBudgetRow ? Number(overallBudgetRow.amount) : 0;
    const overBy = Math.max(0, categoryBudgetsTotal - yearlyBudget);

    return {
      year: Number(year),
      overallBudget: yearlyBudget,
      categoryBudgets,
      reconciliation: {
        categoryBudgetsTotal,
        yearlyBudget,
        overBy,
      },
    };
  },

  
  async setBudget({ category_id = null, year, amount }) {          // this is to set or update a budget (Upsert: category_id = null for overall)
    const targetCategoryId = category_id || null;

    const existing = await db('budgets')
      .where({ year })
      .andWhere((builder) => {
        if (targetCategoryId === null) {
          builder.whereNull('category_id');
        } else {
          builder.where('category_id', targetCategoryId);
        }
      })
      .first();

    if (amount === 0) {
      if (existing) {
        await db('budgets').where({ id: existing.id }).del();
      }
    } else if (existing) {
      await db('budgets').where({ id: existing.id }).update({ amount });
    } else {
      await db('budgets').insert({
        category_id: targetCategoryId,
        year,
        amount,
      });
    }

    return await this.getBudgetsByYear(year);
  },

  async deleteBudget(year, category_id = null) {
    const query = db('budgets').where({ year: Number(year) });
    if (category_id === null || category_id === 'null' || category_id === undefined) {
      query.whereNull('category_id');
    } else {
      query.where('category_id', Number(category_id));
    }

    await query.del();
    return await this.getBudgetsByYear(year);
  },
};

module.exports = budgetService;