const categoryService = require('../services/categoryService');
const { ApiError } = require('../utils/ApiError');
/**
 * Category Controller - Handles HTTP requests(req) & responses(res) for Categories
 */
const categoryController = {
  
  async getAll(req, res, next) {                                                  // GET /api/categories- Fetch all categories   
    try {
      const categories = await categoryService.getAllCategories();
      return res.status(200).json({                                         //standard success response for reads, updates, and deletes(200)
        success: true,
        data: categories
      });
    } catch (error) {                                                         
      next(error);                                                                      // Pass the error to the error handling middleware
      };
    
  },

  
  async getById(req, res, next) {                                                           // GET /api/categories/:id - Fetch a single category by ID
    try {
      const { id } = req.params;                                                      // req.params is an object containing route parameters. In this case, it extracts the id parameter from the URL (e.g., /api/categories/1 would set id to 1).
      const category = await categoryService.getCategoryById(id);

      return res.status(200).json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  },

  
  async create(req, res, next) {                                                  // POST /api/categories- Create a new category
    try {
      const { name, type } = req.body;                                             //req.body is an object containing the parsed body of the request. In this case, it extracts the name and type properties from the incoming JSON payload sent by the client when creating a new category. For more detail:req.body (Request Body / Payload). Where it comes from: The hidden data payload sent inside POST or PUT HTTP requests. How it gets populated: When a user fills out a form on the frontend and clicks "Save", the frontend packages that data as JSON and sends it inside the HTTP request body. Express reads that JSON using the express.json() middleware in app.js and creates req.body.- Example: Client sends JSON: { "name": "Salary", "type": "income" } | Express parses it to: req.body = { name: "Salary", type: "income" }

      // Basic Input Validation

      if (!name || !type) {                                                                           // this is when the user/client sent invalid data
      
         throw new ApiError(400, 'Both "name" and "type" are required fields', 'VALIDATION_ERROR');
      }

      if (!['income', 'expense'].includes(type)) {
       throw new ApiError(400, 'Type must be either "income" or "expense"', 'VALIDATION_ERROR');
      }

      const newCategory = await categoryService.createCategory({ name, type });
      return res.status(201).json({                                         //returned when a new resource is successfully created
        success: true,
        data: newCategory
      });
    } catch (error) {
      next(error);
    }
    
  },

 
  async update(req, res, next) {                                                  //PUT /api/categories/:id - Update an existing category
    try {
      const { id } = req.params;
      const { name, type } = req.body;

      if (type && !['income', 'expense'].includes(type)) {                  
        throw new ApiError(400, 'Type must be either "income" or "expense"', 'VALIDATION_ERROR');
      }

      const updatedCategory = await categoryService.updateCategory(id, { name, type });
      return res.status(200).json({
        success: true,
        data: updatedCategory
      });
    } catch (error) {
      next(error);
    }
  },

  
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const result = await categoryService.deleteCategory(id);
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },

  async reassign(req, res, next) {
    try {
      const { id } = req.params;
      const { targetCategoryId } = req.body;

      if (!targetCategoryId) {
        throw new ApiError(400, 'targetCategoryId is required for reassignment', 'VALIDATION_ERROR');
      }

      const result = await categoryService.reassignAndDelete(id, targetCategoryId);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },

  async reassignToOther(req, res, next) {
    try {
      const { id } = req.params;
      const result = await categoryService.reassignToOtherAndDelete(id);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = categoryController;