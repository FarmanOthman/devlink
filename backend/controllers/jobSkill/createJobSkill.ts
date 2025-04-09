import { Request, Response } from 'express';
import prisma from '../../config/db';

/**
 * Create a new job skill
 */
export const createJobSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId, skillId, skillName, level } = req.body;

    // Validate required fields
    if (!jobId || (!skillId && !skillName)) {
      res.status(400).json({ message: 'Missing required fields: jobId and either skillId or skillName are required' });
      return;
    }

    // Check if the job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    let finalSkillId = skillId;

    // If skillName is provided but no skillId, look for the skill by name or create it
    if (!finalSkillId && skillName) {
      // Try to find existing skill by name
      const existingSkill = await prisma.skill.findUnique({
        where: { name: skillName },
      });
      
      if (existingSkill) {
        // Use existing skill
        finalSkillId = existingSkill.id;
      } else {
        // Create new skill
        const newSkill = await prisma.skill.create({
          data: { name: skillName }
        });
        finalSkillId = newSkill.id;
      }
    } else {
      // Check if the skill exists
      const skill = await prisma.skill.findUnique({
        where: { id: finalSkillId },
      });

      if (!skill) {
        res.status(404).json({ message: 'Skill not found' });
        return;
      }
    }

    // Create the new job skill
    const newJobSkill = await prisma.jobSkill.create({
      data: {
        jobId,
        skillId: finalSkillId,
        level: level || 'BEGINNER', // Default to 'BEGINNER' if level is not provided
      },
      include: {
        skill: true
      }
    });

    res.status(201).json(newJobSkill);
  } catch (error) {
    console.error('Error creating job skill:', error);

    // Handle specific Prisma errors
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      res.status(400).json({ message: 'Job already has this skill' });
      return;
    }

    // Handle other unexpected errors
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to create job skill', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to create job skill', error: 'Unknown error occurred' });
    }
  }
}; 