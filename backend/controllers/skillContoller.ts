import { Request, Response } from 'express';
import prisma from '../config/db';

// Create a new skill
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

// Get all skills
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

// Get a single skill by ID
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

// Update a skill by ID
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

// Delete a skill by ID
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
