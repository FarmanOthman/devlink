import { Request, Response } from 'express';
import prisma from '../../config/db';

/**
 * Get a single job skill by ID
 */
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