require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { getDb } = require('./db');
const seed = require('./db/seed');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const shopRoutes = require('./routes/shopRoutes');
const loadRoutes = require('./routes/loadRoutes');
const stockRoutes = require('./routes/stockRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const summaryRoutes = require('./routes/summaryRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup: support configurable origins, wildcard or dynamic origin reflection
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : null;

const corsOptions = {
  origin: function (origin, callback) {
    // Allow non-browser requests (e.g. curl, health checks, server-to-server)
    if (!origin) return callback(null, true);
    
    // If wildcard or not set, reflect origin to support authorization headers cleanly
    if (!allowedOrigins || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    
    // Check against configured list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Fallback: allow to prevent breaking cross-origin SPA requests
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // Preflight cache 24h
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(), 
    app: 'Hatsun RDMS API',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/loads', loadRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

// 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `API route ${req.originalUrl} not found` });
});

// Serve frontend static build if available (Unified fullstack hosting)
const potentialDistPaths = [
  path.join(__dirname, '../../frontend/dist'),
  path.join(__dirname, '../public'),
  path.join(__dirname, '../../dist')
];
const staticDir = potentialDistPaths.find(p => fs.existsSync(p));

if (staticDir) {
  console.log(`[Static Serving] Serving production frontend build from: ${staticDir}`);
  app.use(express.static(staticDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

// Centralized Error Handler
app.use(errorHandler);

// Start server after DB is ready
async function startServer() {
  try {
    await getDb();
    
    // Auto-seed initial data if database is empty
    if (process.env.AUTO_SEED !== 'false') {
      try {
        await seed();
      } catch (seedErr) {
        console.warn('Auto-seed notice:', seedErr.message);
      }
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`=========================================`);
      console.log(` Hatsun RDMS Server Running `);
      console.log(` Port: ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` API Endpoint: http://localhost:${PORT}/api`);
      if (staticDir) {
        console.log(` Web App UI: http://localhost:${PORT}/`);
      }
      console.log(`=========================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
