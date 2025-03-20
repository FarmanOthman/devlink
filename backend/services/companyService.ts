import { Router } from 'express';
import companyRoutes from '../routes/companyRouters';

const companyService = () => {
    const router = Router();
    router.use(companyRoutes);
    return router;
};

export default companyService; 