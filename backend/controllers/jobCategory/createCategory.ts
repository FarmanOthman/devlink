import { Request, Response } from 'express';
import prisma from '../../config/db';

/**
 * Create a new job category
 */
export const createJobCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;

    // Validate required fields
    if (!name) {
      res.status(400).json({ message: 'Missing required field: name' });
      return;
    }

    // Create the new job category
    const newJobCategory = await prisma.jobCategory.create({
      data: { name }
    });

    res.status(201).json(newJobCategory);
  } catch (error) {
    console.error('Error creating job category:', error);

    // Handle specific Prisma errors
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      res.status(400).json({ message: 'A category with this name already exists' });
      return;
    }

    // Handle other unexpected errors
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to create job category', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to create job category', error: 'Unknown error occurred' });
    }
  }
}; 