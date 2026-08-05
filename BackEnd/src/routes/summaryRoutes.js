const express = require('express');
const router = express.Router();
const summaryController = require('../controllers/summaryController');

router.get('/', summaryController.getSummary);   //this is the GET Route for the summary 


module.exports = router;