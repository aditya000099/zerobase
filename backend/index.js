// backend/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
//const { applyMigrations } = require('./database/migration');

const app = express();
const port = process.env.PORT || 8080;

// Enable CORS for all routes
app.use(cors());

// Allow to get request body
app.use(express.json())


// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');

// Use routes
app.use('/auth', authRoutes);
app.use('/projects', projectRoutes)

// Define a route
app.get('/', (req, res) => {
  res.send('Hello, ZeroBase Backend!');
});

// Start server

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });