import express from 'express';
import {
  createUserSkill,
  getUserSkills,
  getUserSkillById,
  updateUserSkill,
  deleteUserSkill,
} from '../controllers/userSkillController';

const router = express.Router();

// CRUD Routes for UserSkill
router.post('/user-skills', createUserSkill);
router.get('/user-skills', getUserSkills);
router.get('/user-skills/:id', getUserSkillById);
router.put('/user-skills/:id', updateUserSkill);
router.delete('/user-skills/:id', deleteUserSkill);

export default router;
