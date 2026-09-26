const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Cognis Backend API', timestamp: new Date().toISOString() });
});

module.exports = app;