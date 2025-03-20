import { Router } from 'express';
import userSkillRoutes from '../routes/userSkillRoutes';

const userSkillService = () => {
    const router = Router();
    router.use(userSkillRoutes);
    return router;
};

export default userSkillService; 