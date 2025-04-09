import { Router } from 'express';
import jobRoutes from '../routes/jobRoutes';

const jobService = () => {
    const router = Router();
    router.use(jobRoutes);
    return router;
};

export default jobService;
