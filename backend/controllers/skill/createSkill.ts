import { Request, Response } from 'express';
import prisma from '../../config/db';

/**
 * Create a new skill
 */
export const createSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;

    // Validate required fields
    if (!name) {
      res.status(400).json({ message: 'Missing required field: name' });
      return;
    }

    // Check if the skill already exists
    const existingSkill = await prisma.skill.findUnique({
      where: { name },
    });

    if (existingSkill) {
      res.status(400).json({ message: 'Skill already exists' });
      return;
    }

    // Create the new skill
    const newSkill = await prisma.skill.create({
      data: {
        name,
      },
    });

    res.status(201).json(newSkill);
  } catch (error) {
    console.error('Error creating skill:', error);

    // Handle Prisma errors
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      res.status(400).json({ message: 'Skill already exists' });
      return;
    }

    // Handle other unexpected errors
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to create skill', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to create skill', error: 'Unknown error occurred' });
    }
  }
}; 