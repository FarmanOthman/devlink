import { Router } from 'express';
import skillRoutes from '../routes/skillRouters';

const skillService = () => {
    const router = Router();
    router.use(skillRoutes);
    return router;
};

export default skillService; 