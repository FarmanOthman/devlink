import express, { RequestHandler } from 'express';
import {
  createCompany,
  getCompanies,
  getCompanyById,
  getCompanyByName,
  updateCompany,
  deleteCompany,
} from '../controllers/modules/companyController';
import { authMiddleware } from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import { UserRole } from '../types';

const router = express.Router();

// Public routes - Anyone can view companies
router.get('/companies', getCompanies as RequestHandler);
router.get('/companies/:id', getCompanyById as RequestHandler);
router.get('/companies/name/:name', getCompanyByName as RequestHandler);

// Protected routes - Only Admins and Recruiters can modify companies
router.post('/companies', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.ADMIN, UserRole.RECRUITER]) as RequestHandler,
  createCompany as RequestHandler
);

router.put('/companies/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.ADMIN, UserRole.RECRUITER]) as RequestHandler,
  updateCompany as RequestHandler
);

router.delete('/companies/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.ADMIN]) as RequestHandler, // Only admins can delete companies
  deleteCompany as RequestHandler
);

export default router;