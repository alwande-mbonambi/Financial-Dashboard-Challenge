const categoryService = require('../services/categoryService');

/**
 * Category Controller - Handles HTTP requests(req) & responses(res) for Categories
 */
const categoryController = {
  
  async getAll(req, res) {                                                  // GET /api/categories- Fetch all categories   
    try {
      const categories = await categoryService.getAllCategories();
      return res.status(200).json({                                         //standard success response for reads, updates, and deletes(200)
        success: true,
        data: categories
      });
    } catch (error) {                                                         
      return res.status(500).json({                                         // this is for internal server errors(500)
        success: false,                                                      //json standardized envelope- Every response returns { success: true/false, data/message } so the frontend always receives a consistent payload structure.
        message: 'Failed to retrieve categories',
        error: error.message
      });
    }
  },

  
  async getById(req, res) {                                                           // GET /api/categories/:id - Fetch a single category by ID
    try {
      const { id } = req.params;                                                      // req.params is an object containing route parameters. In this case, it extracts the id parameter from the URL (e.g., /api/categories/1 would set id to 1).
      const category = await categoryService.getCategoryById(id);

      if (!category) {
        return res.status(404).json({                                                  //for something that doesn't exist or isnt found
          success: false,
          message: `Category with ID ${id} not found`
        });
      }

      return res.status(200).json({
        success: true,
        data: category
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve category',
        error: error.message
      });
    }
  },

  
  async create(req, res) {                                                  // POST /api/categories- Create a new category
    try {
      const { name, type } = req.body;                                             //req.body is an object containing the parsed body of the request. In this case, it extracts the name and type properties from the incoming JSON payload sent by the client when creating a new category. For more detail:req.body (Request Body / Payload). Where it comes from: The hidden data payload sent inside POST or PUT HTTP requests. How it gets populated: When a user fills out a form on the frontend and clicks "Save", the frontend packages that data as JSON and sends it inside the HTTP request body. Express reads that JSON using the express.json() middleware in app.js and creates req.body.- Example: Client sends JSON: { "name": "Salary", "type": "income" } | Express parses it to: req.body = { name: "Salary", type: "income" }

      // Basic Input Validation

      if (!name || !type) {
        return res.status(400).json({                                           // this is when the user/client sent invalid data
          success: false,
          message: 'Both "name" and "type" are required fields'
        });
      }

      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Type must be either "income" or "expense"'
        });
      }

      const newCategory = await categoryService.createCategory({ name, type });
      return res.status(201).json({                                         //returned when a new resource is successfully created
        success: true,
        data: newCategory
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create category',
        error: error.message
      });
    }
  },

 
  async update(req, res) {                                                  //PUT /api/categories/:id - Update an existing category
    try {
      const { id } = req.params;
      const { name, type } = req.body;

      if (type && !['income', 'expense'].includes(type)) {                  
        return res.status(400).json({
          success: false,
          message: 'Type must be either "income" or "expense"'
        });
      }

      const updatedCategory = await categoryService.updateCategory(id, { name, type });

      if (!updatedCategory) {
        return res.status(404).json({
          success: false,
          message: `Category with ID ${id} not found`
        });
      }

      return res.status(200).json({
        success: true,
        data: updatedCategory
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update category',
        error: error.message
      });
    }
  },

  
  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await categoryService.deleteCategory(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: `Category with ID ${id} not found`,
        });
      }

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      if (error.statusCode === 409) {
        return res.status(409).json({
          success: false,
          message: error.message,
          code: error.code,
          transactionCount: error.transactionCount,
        });
      }

      if (error.statusCode === 400) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to delete category',
        error: error.message,
      });
    }
  },
};

module.exports = categoryController;