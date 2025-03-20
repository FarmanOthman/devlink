import express from 'express';
import {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
} from '../controllers/applicationController';

const router = express.Router();

// CRUD Routes for Application
router.post('/applications', createApplication);
router.get('/applications', getApplications);
router.get('/applications/:id', getApplicationById);
router.put('/applications/:id', updateApplication);
router.delete('/applications/:id', deleteApplication);

export default router;