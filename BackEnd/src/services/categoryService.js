const db = require('../config/db');                                      // im importing my Knex config database connection pool from the db.js file in the config folder.  This is so im using it to query the database in this service file.  I'll use this db object to perform CRUD operations on the categories table in the database.
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
    return category || null;
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
  async updateCategory(id, { name, type }) {                                     //to update an existing category
    const updatedRows = await db('categories')
      .where({ id })
      .update({ name, type });

    if (!updatedRows) return null;
    return this.getCategoryById(id);
  },

  /**
   * 
   * @param {number} id
   * @returns {Promise<boolean>}                                             //True if deleted, false if category didn't exist
   */
  async deleteCategory(id) {                                                  //Delete a category by ID
    const deletedRows = await db('categories').where({ id }).del();
    return deletedRows > 0;
  }
};

module.exports = categoryService;