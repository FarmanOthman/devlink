import express from 'express';
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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

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
  console.log(`Server running on port ${PORT}`);
});