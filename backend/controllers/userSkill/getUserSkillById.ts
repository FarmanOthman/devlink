import { Request, Response } from 'express';
import prisma from '../../config/db';

/**
 * Get a single user skill by ID
 */
export const getUserSkillById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const userSkill = await prisma.userSkill.findUnique({
      where: { id },
      include: {
        user: true,  // Include user details
        skill: true, // Include skill details
      },
    });

    if (!userSkill) {
      res.status(404).json({ message: 'User skill not found' });
      return;
    }

    res.json(userSkill);
  } catch (error) {
    console.error('Error fetching user skill:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch user skill', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch user skill', error: 'Unknown error occurred' });
    }
  }
}; 