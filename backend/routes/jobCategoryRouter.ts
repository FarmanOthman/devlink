import express from 'express';
import {
  createJobCategory,
  getJobCategories,
  getJobCategoryById,
  updateJobCategory,
  deleteJobCategory,
} from '../controllers/jobCategoryController';

const router = express.Router();

// CRUD Routes for JobCategory
router.post('/job-categories', createJobCategory);
router.get('/job-categories', getJobCategories);
router.get('/job-categories/:id', getJobCategoryById);
router.put('/job-categories/:id', updateJobCategory);
router.delete('/job-categories/:id', deleteJobCategory);

export default router;
