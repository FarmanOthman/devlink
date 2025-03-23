import { Request, Response } from 'express';
import prisma from '../../config/db';

/**
 * Get all skills for a specific user
 */
export const getUserSkillsByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Fetch skills for the user
    const userSkills = await prisma.userSkill.findMany({
      where: { userId },
      include: {
        skill: true,
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