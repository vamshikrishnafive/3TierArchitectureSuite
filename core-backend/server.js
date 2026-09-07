const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { testDbConnection } = require('./db');
const coreRoutes = require('./routes/coreRoutes');
const { health } = require('./controllers/coreController');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging for architecture inspection
app.use((req, res, next) => {
  console.log(`[CORE-SERVER :${PORT}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/health', health);

// Mount Core routes
app.use('/api/core', coreRoutes);

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found on Core Service` });
});

// Start Server
async function start() {
  await testDbConnection();
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`💼 CORE BACKEND SERVICE running on port http://localhost:${PORT}`);
    console.log(`   Database: ${process.env.DB_NAME || 'arch_core_db'}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`======================================================\n`);
  });
}

start();
