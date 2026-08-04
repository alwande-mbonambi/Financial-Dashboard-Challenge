const express = require('express');
const categoryRoutes = require('./routes/categoryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');

const app = express();


app.use(express.json());                                  // 1. to allow Express to read JSON data sent to it coming from the frontend.  This is necessary for POST and PUT requests where the client sends data in the request body.  The express.json() middleware parses incoming JSON requests and puts the parsed data in req.body, making it accessible in your route handlers.


app.use('/api/categories', categoryRoutes);               // 2. Connecting my category routes to the URL path /api/categories

app.use('/api/transactions', transactionRoutes);          // 3. Connecting my transaction routes to the URL path /api/transactions

app.use('/api/budgets', budgetRoutes);                    // 4. Connecting my budget routes to the URL path /api/budgets




app.listen(5000, () => {
  console.log('Server is running on http://localhost:5000');
});

//currently just testing my API's    - http://localhost:5000/api/budgets