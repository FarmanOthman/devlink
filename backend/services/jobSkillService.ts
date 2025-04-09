import { Router } from 'express';
import jobSkillRoutes from '../routes/jobSkillRouter';

const jobSkillService = () => {
    const router = Router();
    router.use(jobSkillRoutes);
    return router;
};

export default jobSkillService; 