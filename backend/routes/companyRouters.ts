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

// Public routes - Anyone can view companies
router.get('/companies', getCompanies as RequestHandler);
router.get('/companies/:id', getCompanyById as RequestHandler);
router.get('/companies/name/:name', getCompanyByName as RequestHandler);

// Protected routes - Recruiter and Admin only
// POST /companies: Only Recruiters and Admins can create companies
router.post('/companies', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  createCompany as RequestHandler
);

// PUT /companies/:id: Only Recruiters and Admins can update companies
router.put('/companies/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.RECRUITER, UserRole.ADMIN]) as RequestHandler,
  updateCompany as RequestHandler
);

// DELETE /companies/:id: Only Admins can delete companies
router.delete('/companies/:id', 
  authMiddleware as RequestHandler,
  authorizationMiddleware([UserRole.ADMIN]) as RequestHandler,
  deleteCompany as RequestHandler
);

export default router;