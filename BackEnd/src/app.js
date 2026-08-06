const express = require('express');
const categoryRoutes = require('./routes/categoryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const summaryRoutes = require('./routes/summaryRoutes');
const authRoutes = require('./routes/authRoutes');
const { requireAuth } = require('./middleware/authMiddleware');
const { errorHandler } = require('./middleware/errorHandler');


const cors = require('cors');                                        //cors is for allowing cross-origin requests from the frontend to the backend.  This is necessary when the frontend and backend are running on different ports or domains, which is common in development environments.
const app = express();


app.use(express.json());                                             // to allow Express to read JSON data sent to it coming from the frontend.  This is necessary for POST and PUT requests where the client sends data in the request body.  The express.json() middleware parses incoming JSON requests and puts the parsed data in req.body, making it accessible in your route handlers.



app.use(cors({ origin: 'http://localhost:5173' }));                  // 1. Mount CORS middleware (allows Vite frontend at http://localhost:5173 to communicate)

app.use('/api/auth', authRoutes);                                    //  Public route


app.use('/api/categories', requireAuth, categoryRoutes);             // these are Protected routes   //  Connecting my category routes to the URL path /api/categories

app.use('/api/transactions', requireAuth, transactionRoutes);        // Connecting my transaction routes to the URL path /api/transactions

app.use('/api/budgets', requireAuth, budgetRoutes);                  // Connecting my budget routes to the URL path /api/budgets

app.use('/api/summary', requireAuth, summaryRoutes);                 // Connecting my summary routes to the URL path /api/summary


app.use(errorHandler);
app.listen(5000, () => {
  console.log('Server is running on http://localhost:5000');
});

//currently just testing my API's    - http://localhost:5000//api/transactions