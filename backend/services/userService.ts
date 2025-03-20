import { Router } from 'express';
import userRoutes from '../routes/userRoutes';

const userService = () => {
    const router = Router();
    router.use(userRoutes);
    return router;
};

export default userService;
