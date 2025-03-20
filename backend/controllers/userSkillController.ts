import { Request, Response } from 'express';
import prisma from '../config/db';

// Create a new user skill
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

// Get all user skills
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

// Get a single user skill by ID
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

// Update a user skill by ID
export const updateUserSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, skillId, level } = req.body;

    // Validate required fields
    if (!userId || !skillId) {
      res.status(400).json({ message: 'Missing required fields: userId or skillId' });
      return;
    }

    // Check if the user skill exists
    const existingUserSkill = await prisma.userSkill.findUnique({
      where: { id },
    });

    if (!existingUserSkill) {
      res.status(404).json({ message: 'User skill not found' });
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

    // Update the user skill
    const updatedUserSkill = await prisma.userSkill.update({
      where: { id },
      data: {
        userId,
        skillId,
        level: level || existingUserSkill.level, // Use existing level if not provided
      },
    });

    res.json(updatedUserSkill);
  } catch (error) {
    console.error('Error updating user skill:', error);

    // Handle specific Prisma errors
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      res.status(400).json({ message: 'User already has this skill' });
      return;
    }

    // Handle other unexpected errors
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to update user skill', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to update user skill', error: 'Unknown error occurred' });
    }
  }
};

// Delete a user skill by ID
export const deleteUserSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if the user skill exists
    const existingUserSkill = await prisma.userSkill.findUnique({
      where: { id },
    });

    if (!existingUserSkill) {
      res.status(404).json({ message: 'User skill not found' });
      return;
    }

    // Delete the user skill
    await prisma.userSkill.delete({
      where: { id },
    });

    res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error('Error deleting user skill:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to delete user skill', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to delete user skill', error: 'Unknown error occurred' });
    }
  }
};
