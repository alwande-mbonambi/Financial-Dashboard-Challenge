const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');

router.get('/', budgetController.getByYear);
router.put('/', budgetController.setBudget);
router.delete('/', budgetController.deleteBudget);

module.exports = router;

//theres no POST request because the budget is either set or updated, so we use PUT for upsert functionality. each category (or overall business ceiling) has at most one budget target per year. Because the service method handles category_id: null, a single PUT request covers creating AND updating both types