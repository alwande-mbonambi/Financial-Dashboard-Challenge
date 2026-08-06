const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');


 // These are the Category Routes and the base path: /api/categories (found in app.js).  Each route is associated with a specific HTTP method (GET, POST, PUT, DELETE) and a corresponding controller function that handles the request and response. The controller functions are imported from the categoryController.js file. The routes are defined as follows:


router.get('/', categoryController.getAll);                          // GET /api/categories - Fetch all categories

router.get('/:id', categoryController.getById);                      // GET /api/categories/:id -Fetch single category by ID

router.post('/', categoryController.create);                        // POST /api/categories - Create a new category

router.put('/:id', categoryController.update);                      // PUT /api/categories/:id - Update category by ID

router.delete('/:id', categoryController.delete);                      // DELETE /api/categories/:id - Delete category by ID
router.put('/:id/reassign', categoryController.reassign);           // PUT /api/categories/:id/reassign - Reassign transactions to another category
router.post('/:id/reassign-to-other', categoryController.reassignToOther);   // POST /api/categories/:id/reassign-to-other - Reassign transactions to "Other" category and delete the original category

module.exports = router;