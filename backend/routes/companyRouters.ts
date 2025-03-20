import express from 'express';
import {
  createCompany,
  getCompanies,
  getCompanyById,
  getCompanyByName,
  updateCompany,
  deleteCompany,
} from '../controllers/companyController';

const router = express.Router();

// CRUD Routes for Company
router.post('/companies', createCompany);
router.get('/companies', getCompanies);
router.get('/companies/:id', getCompanyById);
router.get('/companies/name/:name', getCompanyByName);
router.put('/companies/:id', updateCompany);
router.delete('/companies/:id', deleteCompany);

export default router;