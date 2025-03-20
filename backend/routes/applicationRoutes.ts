import express from 'express';
import {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
} from '../controllers/applicationController';
import authMiddleware from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import { UserRole } from '../types';

const router = express.Router();

// Developer only routes
router.post('/applications', 
    authMiddleware,
    authorizationMiddleware([UserRole.DEVELOPER]),
    createApplication
);

// Recruiter and Admin routes
router.get('/applications', 
    authMiddleware,
    authorizationMiddleware([UserRole.RECRUITER, UserRole.ADMIN]),
    getApplications
);

router.get('/applications/:id', 
    authMiddleware,
    authorizationMiddleware([UserRole.RECRUITER, UserRole.ADMIN, UserRole.DEVELOPER]),
    getApplicationById
);

// Recruiter only routes
router.put('/applications/:id', 
    authMiddleware,
    authorizationMiddleware([UserRole.RECRUITER, UserRole.ADMIN]),
    updateApplication
);

router.delete('/applications/:id', 
    authMiddleware,
    authorizationMiddleware([UserRole.RECRUITER, UserRole.ADMIN]),
    deleteApplication
);

export default router;