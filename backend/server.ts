import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
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
import auditLogService from './services/auditLogService';
import { errorMiddleware } from './middlewares/errorMiddleware';
import { sessionMiddleware } from './config/session';
import csrfMiddleware from './middlewares/csrfMiddleware';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-TOKEN', 'X-CSRF-TOKEN'],
  credentials: true, // Allow credentials (cookies)
  maxAge: 600 // Cache preflight requests for 10 minutes
};

app.use(cors(corsOptions));

// Initialize the application
const initApp = async () => {
  console.log('\x1b[36m%s\x1b[0m', '🚀 Starting DevLink server...');
  
  // Security middleware
  app.use(cookieParser(process.env.COOKIE_SECRET)); // For parsing cookies
  app.use(express.json());
  app.use(sessionMiddleware);

  // Apply CSRF protection to all routes
  app.use(csrfMiddleware);

  // Routes
  app.use('/user', userService());
  app.use('/company', companyService());
  app.use('/job', jobService());
  app.use('/application', applicationService());
  app.use('/skill', skillService());
  app.use('/user-skill', userSkillService());
  app.use('/job-skill', jobSkillService());
  app.use('/job-category', jobCategoryService());
  app.use('/document', documentService());
  app.use('/notification', notificationService());
  app.use('/audit-logs', auditLogService());

  // Error handling middleware
  app.use(errorMiddleware);

  // Start server
  app.listen(PORT, () => {
    console.log('\x1b[32m%s\x1b[0m', `✅ Server running on port ${PORT}`);
    console.log('\x1b[36m%s\x1b[0m', `🌐 API available at http://localhost:${PORT}`);
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