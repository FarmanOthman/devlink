import express, { RequestHandler } from 'express';
import {
  createCompany,
  getCompanies,
  getCompanyById,
  getCompanyByName,
  updateCompany,
  deleteCompany,
} from '../controllers/companyController';
import authMiddleware from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import { UserRole } from '../types';

const router = express.Router();

// Public routes
router.get('/companies', getCompanies as RequestHandler);
router.get('/companies/:id', getCompanyById as RequestHandler);
router.get('/companies/name/:name', getCompanyByName as RequestHandler);

// Protected routes - Recruiter and Admin only
router.post('/companies', 
  authMiddleware,
  authorizationMiddleware([UserRole.RECRUITER, UserRole.ADMIN]),
  createCompany as RequestHandler
);

router.put('/companies/:id', 
  authMiddleware,
  authorizationMiddleware([UserRole.RECRUITER, UserRole.ADMIN]),
  updateCompany as RequestHandler
);

router.delete('/companies/:id', 
  authMiddleware,
  authorizationMiddleware([UserRole.ADMIN]),
  deleteCompany as RequestHandler
);

export default router;