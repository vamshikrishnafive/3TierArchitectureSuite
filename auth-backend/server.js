const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { testDbConnection } = require('./db');
const authRoutes = require('./routes/authRoutes');
const { health } = require('./controllers/authController');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging for architecture inspection
app.use((req, res, next) => {
  console.log(`[AUTH-SERVER :${PORT}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/health', health);

// Mount Auth routes
app.use('/api/auth', authRoutes);

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found on Auth Service` });
});

// Start Server
async function start() {
  await testDbConnection();
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🔐 AUTHENTICATION BACKEND running on port http://localhost:${PORT}`);
    console.log(`   Database: ${process.env.DB_NAME || 'arch_auth_db'}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`======================================================\n`);
  });
}

start();
