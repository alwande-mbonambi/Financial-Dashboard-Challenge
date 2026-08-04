const db = require('../config/db'); 

const transactionService = {
  async getAllTransactions() {
    return await db('transactions')
      .join('categories', 'transactions.category_id', 'categories.id')
      .select(
        'transactions.id',
        'transactions.amount',
        'transactions.type',
        'transactions.reference',
        'transactions.notes',
        'transactions.payment_method',
        'transactions.date',
        'transactions.category_id',
        'categories.name as category_name'
      )
      .orderBy('transactions.date', 'desc');
  },

  async getTransactionById(id) {                                     // this is to fetch single transaction by ID
    return await db('transactions')
      .join('categories', 'transactions.category_id', 'categories.id')
      .where('transactions.id', id)
      .select(
        'transactions.id',
        'transactions.amount',
        'transactions.type',
        'transactions.reference',
        'transactions.notes',
        'transactions.payment_method',
        'transactions.date',
        'transactions.category_id',
        'categories.name as category_name'
      )
      .first();
  },

  async createTransaction(transactionData) {                        // this is to reate a new transaction
    const [id] = await db('transactions').insert(transactionData);                // transactionData captures the entire object sent by the controller as one variable
    return await this.getTransactionById(id);
  },       

  async updateTransaction(id, transactionData) {                                          // this is to update a transaction
    const fieldsToUpdate = {};
    if (transactionData.amount !== undefined) fieldsToUpdate.amount = transactionData.amount;
    if (transactionData.type !== undefined) fieldsToUpdate.type = transactionData.type;
    if (transactionData.reference !== undefined) fieldsToUpdate.reference = transactionData.reference;
    if (transactionData.notes !== undefined) fieldsToUpdate.notes = transactionData.notes;
    if (transactionData.payment_method !== undefined) fieldsToUpdate.payment_method = transactionData.payment_method;
    if (transactionData.date !== undefined) fieldsToUpdate.date = transactionData.date;                      
    if (transactionData.category_id !== undefined) fieldsToUpdate.category_id = transactionData.category_id;

    await db('transactions').where({ id }).update(fieldsToUpdate);
    return await this.getTransactionById(id);
  },

  
  async deleteTransaction(id) {                            // Delete transaction
    return await db('transactions').where({ id }).del();
  }
};

module.exports = transactionService;