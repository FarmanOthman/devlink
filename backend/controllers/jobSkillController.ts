import { Request, Response } from 'express';
import prisma from '../config/db';

// Create a new job skill
export const createJobSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId, skillId, level } = req.body;

    // Validate required fields
    if (!jobId || !skillId) {
      res.status(400).json({ message: 'Missing required fields: jobId or skillId' });
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

    // Check if the skill exists
    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
    });

    if (!skill) {
      res.status(404).json({ message: 'Skill not found' });
      return;
    }

    // Create the new job skill
    const newJobSkill = await prisma.jobSkill.create({
      data: {
        jobId,
        skillId,
        level: level || 'BEGINNER', // Default to 'BEGINNER' if level is not provided
      },
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

// Get all job skills
export const getJobSkills = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobSkills = await prisma.jobSkill.findMany({
      include: {
        job: true,   // Include job details
        skill: true, // Include skill details
      },
    });
    res.json(jobSkills);
  } catch (error) {
    console.error('Error fetching job skills:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch job skills', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch job skills', error: 'Unknown error occurred' });
    }
  }
};

// Get a single job skill by ID
export const getJobSkillById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const jobSkill = await prisma.jobSkill.findUnique({
      where: { id },
      include: {
        job: true,   // Include job details
        skill: true, // Include skill details
      },
    });

    if (!jobSkill) {
      res.status(404).json({ message: 'Job skill not found' });
      return;
    }

    res.json(jobSkill);
  } catch (error) {
    console.error('Error fetching job skill:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch job skill', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch job skill', error: 'Unknown error occurred' });
    }
  }
};

// Update a job skill by ID
export const updateJobSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { jobId, skillId, level } = req.body;

    // Validate required fields
    if (!jobId || !skillId) {
      res.status(400).json({ message: 'Missing required fields: jobId or skillId' });
      return;
    }

    // Check if the job skill exists
    const existingJobSkill = await prisma.jobSkill.findUnique({
      where: { id },
    });

    if (!existingJobSkill) {
      res.status(404).json({ message: 'Job skill not found' });
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

    // Check if the skill exists
    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
    });

    if (!skill) {
      res.status(404).json({ message: 'Skill not found' });
      return;
    }

    // Update the job skill
    const updatedJobSkill = await prisma.jobSkill.update({
      where: { id },
      data: {
        jobId,
        skillId,
        level: level || existingJobSkill.level, // Use existing level if not provided
      },
    });

    res.json(updatedJobSkill);
  } catch (error) {
    console.error('Error updating job skill:', error);

    // Handle specific Prisma errors
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      res.status(400).json({ message: 'Job already has this skill' });
      return;
    }

    // Handle other unexpected errors
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to update job skill', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to update job skill', error: 'Unknown error occurred' });
    }
  }
};

// Delete a job skill by ID
export const deleteJobSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if the job skill exists
    const existingJobSkill = await prisma.jobSkill.findUnique({
      where: { id },
    });

    if (!existingJobSkill) {
      res.status(404).json({ message: 'Job skill not found' });
      return;
    }

    // Delete the job skill
    await prisma.jobSkill.delete({
      where: { id },
    });

    res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error('Error deleting job skill:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to delete job skill', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to delete job skill', error: 'Unknown error occurred' });
    }
  }
};
