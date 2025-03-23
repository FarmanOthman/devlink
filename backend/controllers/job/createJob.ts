import { Request, Response } from 'express';
import prisma from '../../config/db';

/**
 * Create a new job
 */
export const createJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, location, type, companyId, userId, categoryId } = req.body;

    // Validate required fields
    if (!title || !description || !location || !companyId || !userId || !categoryId) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    // Check if the company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      res.status(404).json({ message: 'Company not found' });
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

    // Check if the category exists
    const category = await prisma.jobCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      res.status(404).json({ message: 'Job category not found' });
      return;
    }

    // Create the new job using connect syntax for relations
    const newJob = await prisma.job.create({
      data: {
        title,
        description,
        location,
        type,
        company: {
          connect: { id: companyId }
        },
        user: {
          connect: { id: userId }
        },
        category: {
          connect: { id: categoryId }
        }
      },
      include: {
        company: true,
        category: true
      }
    });

    res.status(201).json(newJob);
  } catch (error) {
    console.error('Error creating job:', error);

    // Handle specific Prisma errors
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      res.status(400).json({ message: 'Job with the same title already exists' });
      return;
    }

    // Handle other unexpected errors
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to create job', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to create job', error: 'Unknown error occurred' });
    }
  }
}; 