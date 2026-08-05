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
      const { amount, type, reference, notes, payment_method, date, category_id } = req.body;

      // Validate required fields
      
    if (amount === undefined || amount === null || !type || !date || !category_id || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'amount, type, date, category_id, and payment_method are required fields.',
      });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number greater than 0.',
      });
    }

      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Type must be either "income" or "expense".',
        });

      }

      if (!['Cash', 'Card', 'EFT'].includes(payment_method)) {
        return res.status(400).json({
          success: false,
          message: 'payment_method must be either "Cash", "Card", or "EFT".',
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
        amount: numericAmount,
        type,
        reference: reference || null,
        notes: notes || null,
        payment_method,
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
      const { amount, type, reference, notes, payment_method, date, category_id } = req.body;

      let numericAmount;
    if (amount !== undefined) {
      numericAmount = Number(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a positive number greater than 0.',
        });
      }
    }

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

      if (payment_method && !['Cash', 'Card', 'EFT'].includes(payment_method)) {
        return res.status(400).json({
          success: false,
          message: 'payment_method must be either "Cash", "Card", or "EFT".',
        });
      }

      const updatedTransaction = await transactionService.updateTransaction(id, {
        amount: numericAmount,
        type,
        reference: reference || null,
        notes: notes || null,
        payment_method,
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

//this is the get for the payment split
 async getPaymentSplit(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const data = await transactionService.getPaymentMethodSplit(startDate, endDate);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve payment method split',
        error: error.message,
      });
    }
  },
};

module.exports = transactionController;