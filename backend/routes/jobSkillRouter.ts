import express from 'express';
import {
  createJobSkill,
  getJobSkills,
  getJobSkillById,
  updateJobSkill,
  deleteJobSkill,
} from '../controllers/jobSkillController';

const router = express.Router();

// CRUD Routes for JobSkill
router.post('/job-skills', createJobSkill);
router.get('/job-skills', getJobSkills);
router.get('/job-skills/:id', getJobSkillById);
router.put('/job-skills/:id', updateJobSkill);
router.delete('/job-skills/:id', deleteJobSkill);

export default router;
