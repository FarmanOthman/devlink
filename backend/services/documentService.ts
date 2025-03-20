import { Router } from 'express';
import documentRoutes from '../routes/documentRoutes';

const documentService = () => {
    const router = Router();
    router.use(documentRoutes);
    return router;
};

export default documentService; 