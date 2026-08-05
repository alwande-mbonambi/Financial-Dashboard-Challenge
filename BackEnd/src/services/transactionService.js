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
  },


  //this is for the payment split
 
  // Get count & largest-remainder percentage of transactions per payment method // Get count & percentage of transactions per payment method
  async getPaymentMethodSplit(startDate, endDate) {
    let query = db('transactions');

    if (startDate && endDate) {
      query = query.whereBetween('date', [startDate, endDate]);
    }

    const totalCountResult = await query.clone().count('id as total').first();
    const totalTransactions = Number(totalCountResult.total) || 0;

    const splitResult = await query
      .select('payment_method')
      .count('id as count')
      .groupBy('payment_method');

    const methods = ['Cash', 'Card', 'EFT'];

    if (totalTransactions === 0) {
      return {
        totalTransactions: 0,
        split: methods.map((name) => ({ name, count: 0, pct: 0 })),
      };
    }

    // 1. Calculate exact percentages and floor values
    const methodData = methods.map((name) => {
      const found = splitResult.find((r) => r.payment_method === name);
      const count = found ? Number(found.count) : 0;
      const exactPct = (count / totalTransactions) * 100;
      const floorPct = Math.floor(exactPct);
      const remainder = exactPct - floorPct;

      return { name, count, exactPct, pct: floorPct, remainder };
    });

    // 2. Largest-remainder adjustment to guarantee 100% total sum
    const currentSum = methodData.reduce((sum, m) => sum + m.pct, 0);
    let remainderPoints = 100 - currentSum;

    // Sort by remainder descending to distribute remainder points
    const sortedByRemainder = [...methodData].sort((a, b) => b.remainder - a.remainder);

    for (let i = 0; i < remainderPoints; i++) {
      sortedByRemainder[i].pct += 1;
    }

    // Sort final result by count descending
    methodData.sort((a, b) => b.count - a.count);

    return {
      totalTransactions,
      split: methodData.map(({ name, count, pct }) => ({ name, count, pct })),
    };
  },



  
};

module.exports = transactionService;