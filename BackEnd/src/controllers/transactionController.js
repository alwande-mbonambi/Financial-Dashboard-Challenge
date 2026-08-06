const transactionService = require('../services/transactionService');
const categoryService = require('../services/categoryService');
const { ApiError } = require('../utils/ApiError');

const transactionController = {

  async getAll(req, res, next) {                                                 // GET /api/transactions
    try {
      const transactions = await transactionService.getAllTransactions();
      return res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  },

 
  async getById(req, res, next) {                                                    // GET /api/transactions/:id
    try {
      const { id } = req.params;
      const transaction = await transactionService.getTransactionById(id);

      return res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  },



  async create(req, res, next) {                                                         // POST /api/transactions
    try {
      const { amount, type, reference, notes, payment_method, date, category_id } = req.body;

      // Validate required fields
      
      if (amount === undefined || amount === null || !type || !date || !category_id || !payment_method) {
        throw new ApiError(400, 'amount, type, date, category_id, and payment_method are required fields.', 'VALIDATION_ERROR');
      }

      const numericAmount = Number(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new ApiError(400, 'Amount must be a positive number greater than 0.', 'VALIDATION_ERROR');
      }

      if (!['income', 'expense'].includes(type)) {
        throw new ApiError(400, 'Type must be either "income" or "expense".', 'VALIDATION_ERROR');
      }

      if (!['Cash', 'Card', 'EFT'].includes(payment_method)) {
        throw new ApiError(400, 'payment_method must be either "Cash", "Card", or "EFT".', 'VALIDATION_ERROR');
      }


      // Verify foreign key category exists
     const existingCategory = await categoryService.getCategoryById(category_id);
      if (!existingCategory) {
        throw new ApiError(400, `Category with ID ${category_id} does not exist.`, 'VALIDATION_ERROR');
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
      next(error);
    }
  },

  
  async update(req, res, next) {                                                            // PUT /api/transactions/:id
    try {  
      const { id } = req.params;
      const { amount, type, reference, notes, payment_method, date, category_id } = req.body;

      let numericAmount;
      if (amount !== undefined) {
        numericAmount = Number(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
          throw new ApiError(400, 'Amount must be a positive number greater than 0.', 'VALIDATION_ERROR');
        }
      
      }

      if (type && !['income', 'expense'].includes(type)) {
        throw new ApiError(400, 'Type must be either "income" or "expense".', 'VALIDATION_ERROR');
 
      }

      if (category_id) {
        const existingCategory = await categoryService.getCategoryById(category_id);
        if (!existingCategory) {
          throw new ApiError(400, `Category with ID ${category_id} does not exist.`, 'VALIDATION_ERROR');
        }            
      }

      if (payment_method && !['Cash', 'Card', 'EFT'].includes(payment_method)) {
        throw new ApiError(400, 'payment_method must be either "Cash", "Card", or "EFT".', 'VALIDATION_ERROR');
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
      next(error);
    }
  },

  
  async delete(req, res, next) {                                                            // DELETE /api/transactions/:id
    try { 
      const { id } = req.params;
      const deletedRows = await transactionService.deleteTransaction(id);

      return res.status(200).json({
        success: true,
        message: `Transaction with ID ${id} deleted successfully`,
      });
    } catch (error) {
      next(error);
    }
  },

//this is the get for the payment split
 async getPaymentSplit(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const data = await transactionService.getPaymentMethodSplit(startDate, endDate);
      return res.status(200).json({ success: true, data });
    } 
      catch (error) {
      next(error);
    }
  }
  
};

module.exports = transactionController;