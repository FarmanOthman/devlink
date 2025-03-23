import { Request, Response } from 'express';
import prisma from '../../config/db';

/**
 * Create a new user skill
 */
export const createUserSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, skillId, level } = req.body;

    // Validate required fields
    if (!userId || !skillId) {
      res.status(400).json({ message: 'Missing required fields: userId or skillId' });
      return;
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if the skill exists
    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
    });

    if (!skill) {
      res.status(404).json({ message: 'Skill not found' });
      return;
    }

    // Create the new user skill
    const newUserSkill = await prisma.userSkill.create({
      data: {
        userId,
        skillId,
        level: level || 'BEGINNER', // Default to 'BEGINNER' if level is not provided
      },
    });

    res.status(201).json(newUserSkill);
  } catch (error) {
    console.error('Error creating user skill:', error);

    // Handle specific Prisma errors
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      res.status(400).json({ message: 'User already has this skill' });
      return;
    }

    // Handle other unexpected errors
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to create user skill', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to create user skill', error: 'Unknown error occurred' });
    }
  }
}; 