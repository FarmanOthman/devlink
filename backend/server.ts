import express from 'express';
import prisma from './config/db';
import userRoutes from './routes/userRoutes';
import companyRoutes from './routes/companyRouters';
import { errorMiddleware } from './middlewares/errorMiddleware';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Routes
app.use('/user', userRoutes);
app.use('/company', companyRoutes);

// Error handling middleware
app.use(errorMiddleware);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});