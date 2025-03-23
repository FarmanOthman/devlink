import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import userService from './services/userService';
import companyService from './services/companyService';
import jobService from './services/jobService';
import applicationService from './services/applicationService';
import skillService from './services/skillService';
import userSkillService from './services/userSkillService';
import jobSkillService from './services/jobSkillService';
import jobCategoryService from './services/jobCategoryService';
import documentService from './services/documentService';
import notificationService from './services/notificationService';
import savedJobService from './services/savedJobService';
import { errorMiddleware } from './middlewares/errorMiddleware';
import { sessionMiddleware } from './config/session';
import csrfMiddleware from './middlewares/csrfMiddleware';
import { authRateLimiter } from './middlewares/authMiddleware';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-TOKEN', 'X-CSRF-TOKEN', 'x-skip-csrf-check'],
  credentials: true, // Allow credentials (cookies)
  maxAge: 600 // Cache preflight requests for 10 minutes
};

app.use(cors(corsOptions));

// Initialize the application
const initApp = async () => {
  console.log('\x1b[36m%s\x1b[0m', '🚀 Starting DevLink server...');
  
  // Basic security headers
  app.use(helmet());
  
  // Request parsing and security middleware
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser(process.env.COOKIE_SECRET));
  app.use(sessionMiddleware);
  
  // Compression
  app.use(compression());
  
  // Logging
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }
  
  // Global rate limiting
  const globalRateLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: { message: 'Too many requests from this IP, please try again later' },
  });
  
  app.use(globalRateLimiter);
  
  // Apply CSRF protection with development bypass option
  app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'development' && req.headers['x-skip-csrf-check']) {
      next();
    } else {
      csrfMiddleware(req, res, next);
    }
  });

  // CSRF token endpoint
  app.get('/devlink/csrf-token', (req, res) => {
    if (typeof req.csrfToken === 'function') {
      res.json({ csrfToken: req.csrfToken() });
    } else {
      res.status(500).json({ message: 'CSRF functionality not available' });
    }
  });
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  });

  // Apply rate limiter to auth routes specifically
  app.use('/devlink/users/login', authRateLimiter);
  app.use('/devlink/users/register', authRateLimiter);
  
  // Routes
  app.use('/devlink', userService());
  app.use('/devlink', companyService());
  app.use('/devlink', jobService());
  app.use('/devlink', applicationService());
  app.use('/devlink', skillService());
  app.use('/devlink', userSkillService());
  app.use('/devlink', jobSkillService());
  app.use('/devlink', jobCategoryService());
  app.use('/devlink', documentService());
  app.use('/devlink', notificationService());
  app.use('/devlink', savedJobService());

  // Add security headers to responses
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Error handling middleware
  app.use(errorMiddleware);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  // Start server
  app.listen(PORT, () => {
    console.log('\x1b[32m%s\x1b[0m', `✅ Server running on port ${PORT}`);
    console.log('\x1b[36m%s\x1b[0m', `🌐 API available at http://localhost:${PORT}/devlink`);
  });
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\x1b[33m%s\x1b[0m', '🛑 SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

// Initialize the application
initApp().catch((error) => {
  console.error('\x1b[31m%s\x1b[0m', '❌ Failed to initialize application:', error);
  process.exit(1);
});