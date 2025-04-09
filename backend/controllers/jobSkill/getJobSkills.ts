import { Request, Response } from 'express';
import prisma from '../../config/db';

/**
 * Get all job skills
 */
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