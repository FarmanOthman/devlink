import express from "express";
import {
  getSkills,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
} from "../controllers/skillContoller";

const router = express.Router();

// Define routes
router.get("/skills", getSkills);
router.get("/skills/:id", getSkillById);
router.post("/skills", createSkill);
router.put("/skills/:id", updateSkill);
router.delete("/skills/:id", deleteSkill);

export default router;
