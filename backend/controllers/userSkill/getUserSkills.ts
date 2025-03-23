import { Request, Response } from 'express';
import prisma from '../../config/db';

/**
 * Get all user skills
 */
export const getUserSkills = async (req: Request, res: Response): Promise<void> => {
  try {
    const userSkills = await prisma.userSkill.findMany({
      include: {
        user: true,  // Include user details
        skill: true, // Include skill details
      },
    });
    res.json(userSkills);
  } catch (error) {
    console.error('Error fetching user skills:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch user skills', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch user skills', error: 'Unknown error occurred' });
    }
  }
}; 