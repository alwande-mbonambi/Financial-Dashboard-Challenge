const db = require('../config/db');                                      // im importing my Knex config database connection pool from the db.js file in the config folder.  This is so im using it to query the database in this service file.  I'll use this db object to perform CRUD operations on the categories table in the database.
const { ApiError } = require('../utils/ApiError');
/**
 *
 */
const categoryService = {
  /**
   *                                                             
   * @returns {Promise<Array>}                                          // List of all the category objects     (@param and @returns are JSDoc comments that provide type information and descriptions for the function parameters and return values. They help developers understand the expected input and output of the function, making the code more readable and maintainable.)
   */
  async getAllCategories() {                                             //ensuring that the categories are displayed in alphabetical order
    return await db('categories').select('*').orderBy('name', 'asc');
  },

  /**
   * 
   * @param {number} id 
   * @returns {Promise<Object|null>}                                         //Category object or null if not found
   */
  async getCategoryById(id) {                                                //to fetch a single category by its ID
    const category = await db('categories').where({ id }).first();           //.first() to ensure knex automatically unpacks the first item out of that array for you and appends LIMIT 1 to the SQL query      
    if (!category) {
    throw new ApiError(404, `Category with ID ${id} not found`, 'CATEGORY_NOT_FOUND');
  }

  return category;
  },

  /**
   *
   * @param {Object} categoryData                                           
   * @returns {Promise<Object>}                                               // the newly created category record
   */
  async createCategory({ name, type }) {
    const [id] = await db('categories').insert({ name, type });               //to create a new category
    return this.getCategoryById(id);
  },

  /**
   *
   * @param {number} id 
   * @param {Object} updateData 
   * @returns {Promise<Object|null>}                                             //Updated category or null if not found
   */
  
  async updateCategory(id, categoryData) {                                          //to Update category
    const fieldsToUpdate = {};
    if (categoryData.name !== undefined) fieldsToUpdate.name = categoryData.name;
    if (categoryData.type !== undefined) fieldsToUpdate.type = categoryData.type;

    await db('categories').where({ id }).update(fieldsToUpdate);
    return await this.getCategoryById(id);
  },

  /**
   * Delete category if zero transactions exist, otherwise throw 409 block
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async deleteCategory(id) {
    const categoryToDelete = await this.getCategoryById(id);
    
    if (categoryToDelete.name.toLowerCase() === 'other') {
      const error = new Error('The default "Other" category cannot be deleted.');
      error.statusCode = 400;
      throw error;
    }

    // Check count of transactions linked to this category
    const transactionCountResult = await db('transactions')
      .where({ category_id: id })
      .count('id as count')
      .first();

    const transactionCount = Number(transactionCountResult?.count) || 0;

    // Block deletion if transactions exist
    if (transactionCount > 0) {
      const error = new Error('Re-assign transactions to another category, or auto-reassign to Other.');
      error.statusCode = 409;
      error.code = 'CATEGORY_HAS_TRANSACTIONS';
      error.transactionCount = transactionCount;
      throw error;
    }

    // Plain delete when 0 transactions are attached
    await db('categories').where({ id }).del();
    return { message: 'Category successfully deleted.' };
  },

  /**
   * Reassign transactions to a specified target category, then delete source category
   * @param {number} id
   * @param {number} targetCategoryId
   * @returns {Promise<Object|null>}
   */
  async reassignAndDelete(id, targetCategoryId) {
    const categoryToDelete = await this.getCategoryById(id);

    if (categoryToDelete.name.toLowerCase() === 'other') {
      const error = new Error('The default "Other" category cannot be deleted.');
      error.statusCode = 400;
      throw error;
    }

    if (Number(id) === Number(targetCategoryId)) {
      const error = new Error('Cannot reassign transactions to the same category being deleted.');
      error.statusCode = 400;
      throw error;
    }

    const targetCategory = await this.getCategoryById(targetCategoryId);
    if (!targetCategory) {
      const error = new Error('Target category does not exist.');
      error.statusCode = 400;
      throw error;
    }

    return await db.transaction(async (trx) => {
      await trx('transactions')
        .where({ category_id: id })
        .update({ category_id: targetCategoryId });

      await trx('categories').where({ id }).del();

      return {
        message: `Transactions reassigned to "${targetCategory.name}" and category deleted successfully.`,
      };
    });
  },

  /**
   * 
   * @param {number} id                                                    //this is to find-or-create default "Other" category, reassign transactions, then delete category
   * @returns {Promise<Object|null>}
   */
  async reassignToOtherAndDelete(id) {
    const categoryToDelete = await this.getCategoryById(id);

    if (categoryToDelete.name.toLowerCase() === 'other') {
      const error = new Error('The default "Other" category cannot be deleted.');
      error.statusCode = 400;
      throw error;
    }

    return await db.transaction(async (trx) => {
      let defaultCategory = await trx('categories')
        .where({ type: categoryToDelete.type })
        .whereRaw('LOWER(name) = ?', ['other'])
        .first();

      if (!defaultCategory) {
        const [otherId] = await trx('categories').insert({
          name: 'Other',
          type: categoryToDelete.type,
        });
        defaultCategory = { id: otherId, name: 'Other', type: categoryToDelete.type };
      }

      await trx('transactions')
        .where({ category_id: id })
        .update({ category_id: defaultCategory.id });

      await trx('categories').where({ id }).del();

      return {
        message: `Transactions reassigned to "${defaultCategory.name}" and category deleted successfully.`,
      };
    });
  },
};

module.exports = categoryService;