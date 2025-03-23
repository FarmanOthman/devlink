import { Router } from 'express';
import applicationRoutes from '../routes/applicationRoutes';
import interviewRoutes from '../routes/interviewRoutes';

const applicationService = () => {
    const router = Router();
    
    // Include both application and interview routes
    router.use(applicationRoutes);
    router.use(interviewRoutes);
    
    return router;
};

export default applicationService;
