import { Router } from 'express';
import applicationRoutes from '../routes/applicationRoutes';

const applicationService = () => {
    const router = Router();
    router.use(applicationRoutes);
    return router;
};

export default applicationService;
