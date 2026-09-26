const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const studyRoutes = require('./routes/study.routes');
const experimentRoutes = require('./routes/experiment.routes');

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger for database write transparency
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API ${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', studyRoutes);
app.use('/api', experimentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Cognis Backend API', timestamp: new Date().toISOString() });
});

module.exports = app;