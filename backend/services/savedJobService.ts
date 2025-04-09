import { Router } from 'express';
import savedJobRoutes from '../routes/savedJobRoutes';

const savedJobService = () => {
    const router = Router();
    router.use(savedJobRoutes);
    return router;
};

export default savedJobService; 