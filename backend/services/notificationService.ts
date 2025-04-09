import { Router } from 'express';
import notificationRoutes from '../routes/notificationRoutes';

const notificationService = () => {
    const router = Router();
    router.use(notificationRoutes);
    return router;
};

export default notificationService; 