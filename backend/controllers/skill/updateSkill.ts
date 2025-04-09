import { Request, Response } from 'express';
import prisma from '../../config/db';

/**
 * Update a skill by ID
 */
export const updateSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Validate required fields
    if (!name) {
      res.status(400).json({ message: 'Missing required field: name' });
      return;
    }

    // Check if the skill exists
    const existingSkill = await prisma.skill.findUnique({
      where: { id },
    });

    if (!existingSkill) {
      res.status(404).json({ message: 'Skill not found' });
      return;
    }

    // Update the skill
    const updatedSkill = await prisma.skill.update({
      where: { id },
      data: {
        name,
      },
    });

    res.json(updatedSkill);
  } catch (error) {
    console.error('Error updating skill:', error);

    // Handle Prisma errors
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      res.status(400).json({ message: 'Skill already exists' });
      return;
    }

    // Handle other unexpected errors
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to update skill', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to update skill', error: 'Unknown error occurred' });
    }
  }
}; 