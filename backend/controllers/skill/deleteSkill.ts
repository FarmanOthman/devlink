import { Request, Response } from 'express';
import prisma from '../../config/db';

/**
 * Delete a skill by ID
 */
export const deleteSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if the skill exists
    const existingSkill = await prisma.skill.findUnique({
      where: { id },
    });

    if (!existingSkill) {
      res.status(404).json({ message: 'Skill not found' });
      return;
    }

    // Delete the skill
    await prisma.skill.delete({
      where: { id },
    });

    res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error('Error deleting skill:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to delete skill', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to delete skill', error: 'Unknown error occurred' });
    }
  }
}; 