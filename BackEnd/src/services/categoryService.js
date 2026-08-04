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
  
  async updateCategory(id, categoryData) {                                          //to Update category
    const fieldsToUpdate = {};
    if (categoryData.name !== undefined) fieldsToUpdate.name = categoryData.name;
    if (categoryData.type !== undefined) fieldsToUpdate.type = categoryData.type;

    await db('categories').where({ id }).update(fieldsToUpdate);
    return await this.getCategoryById(id);
  },

  /**
   * 
   * @param {number} id
   * @returns {Promise<Object|null>}                                             //True if deleted, false if category didn't exist
   */
                                                                              // to safely delete category & reassign transactions to "Other"
  async deleteCategory(id) {
    const categoryToDelete = await this.getCategoryById(id);
    if (!categoryToDelete) return null;

                                                                                             // this is to block deleting the system default "Other" category
    if (categoryToDelete.name.toLowerCase() === 'other') {
      const error = new Error('The default "Other" category cannot be deleted.');
      error.statusCode = 400;
      throw error;
    }

    return await db.transaction(async (trx) => {                                 //
      
      let defaultCategory = await trx('categories')                                //1.to find or create default "Other" category matching the type
        .where({ type: categoryToDelete.type }) 
        .whereRaw('LOWER(name) = ?', ['other'])
        .first();

      if (!defaultCategory) {
        const [otherId] = await trx('categories').insert({
          name: 'Other',
          type: categoryToDelete.type,
        });
        defaultCategory = { id: otherId, name: 'Other' };
      }

      
      await trx('transactions')                                                     // 2. to reassign transactions linked to target category over to "Other"
        .where({ category_id: id })
        .update({ category_id: defaultCategory.id });

      
      await trx('categories').where({ id }).del();  //deleting the requested category

      return {
        message: `Category successfully deleted. Linked transactions were reassigned to "${defaultCategory.name}".`,
      };
    });
  },
};

module.exports = categoryService;