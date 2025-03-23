import { Request, Response } from 'express';
import prisma from '../../config/db';

/**
 * Get a single skill by ID
 */
export const getSkillById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const skill = await prisma.skill.findUnique({
      where: { id },
    });

    if (!skill) {
      res.status(404).json({ message: 'Skill not found' });
      return;
    }

    res.json(skill);
  } catch (error) {
    console.error('Error fetching skill:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch skill', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch skill', error: 'Unknown error occurred' });
    }
  }
}; 