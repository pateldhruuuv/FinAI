const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Enable CORS
app.use(cors());

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Create uploads directory if not exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('Created temporary uploads directory');
}

// Mount Routes
// Auth endpoints: POST /auth/register and POST /auth/login
app.use('/auth', require('./routes/auth'));

// Root-level transaction/AI endpoints:
// POST /upload-statement, GET /dashboard, POST /recommend-investment, POST /recommend-insurance, POST /predict-health, POST /chat
app.use('/', require('./routes/transactions'));
app.use('/', require('./routes/ai'));
app.use('/', require('./routes/planners'));
app.use('/', require('./routes/premium'));

// Basic error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Something went wrong on the server',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Express Backend Server running on port ${PORT}`);
});
