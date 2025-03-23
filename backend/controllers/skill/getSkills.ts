import { Request, Response } from 'express';
import prisma from '../../config/db';

/**
 * Get all skills
 */
export const getSkills = async (req: Request, res: Response): Promise<void> => {
  try {
    const skills = await prisma.skill.findMany();
    res.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch skills', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch skills', error: 'Unknown error occurred' });
    }
  }
}; 