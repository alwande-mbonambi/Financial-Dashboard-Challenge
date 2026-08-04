const transactionService = require('../services/transactionService');
const categoryService = require('../services/categoryService');

const transactionController = {

  async getAll(req, res) {                                                 // GET /api/transactions
    try {
      const transactions = await transactionService.getAllTransactions();
      return res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve transactions',
        error: error.message,
      });
    }
  },

 
  async getById(req, res) {                                                    // GET /api/transactions/:id
    try {
      const { id } = req.params;
      const transaction = await transactionService.getTransactionById(id);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: `Transaction with ID ${id} not found`,
        });
      }

      return res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve transaction',
        error: error.message,
      });
    }
  },



  async create(req, res) {                                                         // POST /api/transactions
    try {
      const { amount, type, description, date, category_id } = req.body;

      // Validate required fields
      if (!amount || !type || !date || !category_id) {
        return res.status(400).json({
          success: false,
          message: 'amount, type, date, and category_id are required fields.',
        });
      }

      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Type must be either "income" or "expense".',
        });
      }

      // Verify foreign key category exists
      const existingCategory = await categoryService.getCategoryById(category_id);
      if (!existingCategory) {
        return res.status(400).json({
          success: false,
          message: `Category with ID ${category_id} does not exist.`,
        });
      }

      const newTransaction = await transactionService.createTransaction({
        amount,
        type,
        description: description || '',
        date,
        category_id,
      });

      return res.status(201).json({
        success: true,
        data: newTransaction,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create transaction',
        error: error.message,
      });
    }
  },

  
  async update(req, res) {                                                            // PUT /api/transactions/:id
    try {  
      const { id } = req.params;
      const { amount, type, description, date, category_id } = req.body;

      const existingTransaction = await transactionService.getTransactionById(id);
      if (!existingTransaction) {
        return res.status(404).json({
          success: false,
          message: `Transaction with ID ${id} not found`,
        });
      }

      if (type && !['income', 'expense'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Type must be either "income" or "expense".',
        });
      }

      if (category_id) {
        const existingCategory = await categoryService.getCategoryById(category_id);
        if (!existingCategory) {
          return res.status(400).json({
            success: false,
            message: `Category with ID ${category_id} does not exist.`,
          });
        }
      }

      const updatedTransaction = await transactionService.updateTransaction(id, {
        amount,
        type,
        description,
        date,
        category_id,
      });

      return res.status(200).json({
        success: true,
        data: updatedTransaction,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update transaction',
        error: error.message,
      });
    }
  },

  
  async delete(req, res) {                                                            // DELETE /api/transactions/:id
    try { 
      const { id } = req.params;
      const deletedRows = await transactionService.deleteTransaction(id);

      if (!deletedRows) {
        return res.status(404).json({
          success: false,
          message: `Transaction with ID ${id} not found`,
        });
      }

      return res.status(200).json({
        success: true,
        message: `Transaction with ID ${id} deleted successfully`,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete transaction',
        error: error.message,
      });
    }
  },
};

module.exports = transactionController;