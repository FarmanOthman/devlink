import express from 'express';
import userRoutes from './routes/userRoutes';
import companyRoutes from './routes/companyRouters';
import jobRouters from './routes/jobRoutes';
import applicationRouters from './routes/applicationRoutes';
import skillRouters from './routes/skillRouters';
import userSkillRouters from './routes/userSkillRoutes';
import jobSkillRouters from './routes/jobSkillRouter';
import jobCategoryRouters from './routes/jobCategoryRouter';
import { errorMiddleware } from './middlewares/errorMiddleware';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Routes
app.use('/user', userRoutes);
app.use('/company', companyRoutes);
app.use('/job', jobRouters);
app.use('/application', applicationRouters);
app.use('/skill', skillRouters);
app.use('/user-skill', userSkillRouters);
app.use('/job-skill', jobSkillRouters);
app.use('/job-category', jobCategoryRouters);

// Error handling middleware
app.use(errorMiddleware);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});