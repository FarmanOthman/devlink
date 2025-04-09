import { Router } from 'express';
import jobCategoryRoutes from '../routes/jobCategoryRouter';

const jobCategoryService = () => {
    const router = Router();
    router.use(jobCategoryRoutes);
    return router;
};

export default jobCategoryService; 