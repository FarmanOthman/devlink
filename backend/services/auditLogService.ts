import { Router } from 'express';
import auditLogRoutes from '../routes/auditLogRoutes';

const auditLogService = () => {
    const router = Router();
    router.use(auditLogRoutes);
    return router;
};

export default auditLogService; 