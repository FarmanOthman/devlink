import { Request, Response } from 'express';
import prisma from '../config/db';

// Create a new job category
export const createJobCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId, name } = req.body;

    // Validate required fields
    if (!jobId || !name) {
      res.status(400).json({ message: 'Missing required fields: jobId or name' });
      return;
    }

    // Check if the job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    // Create the new job category
    const newJobCategory = await prisma.jobCategory.create({
      data: {
        jobId,
        name,
      },
    });

    res.status(201).json(newJobCategory);
  } catch (error) {
    console.error('Error creating job category:', error);

    // Handle specific Prisma errors
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      res.status(400).json({ message: 'Job already has a category with this name' });
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

// Get all job categories
export const getJobCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobCategories = await prisma.jobCategory.findMany({
      include: {
        job: true, // Include job details
      },
    });
    res.json(jobCategories);
  } catch (error) {
    console.error('Error fetching job categories:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch job categories', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch job categories', error: 'Unknown error occurred' });
    }
  }
};

// Get a single job category by ID
export const getJobCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const jobCategory = await prisma.jobCategory.findUnique({
      where: { id },
      include: {
        job: true, // Include job details
      },
    });

    if (!jobCategory) {
      res.status(404).json({ message: 'Job category not found' });
      return;
    }

    res.json(jobCategory);
  } catch (error) {
    console.error('Error fetching job category:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch job category', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch job category', error: 'Unknown error occurred' });
    }
  }
};

// Update a job category by ID
export const updateJobCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { jobId, name } = req.body;

    // Validate required fields
    if (!jobId || !name) {
      res.status(400).json({ message: 'Missing required fields: jobId or name' });
      return;
    }

    // Check if the job category exists
    const existingJobCategory = await prisma.jobCategory.findUnique({
      where: { id },
    });

    if (!existingJobCategory) {
      res.status(404).json({ message: 'Job category not found' });
      return;
    }

    // Check if the job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    // Update the job category
    const updatedJobCategory = await prisma.jobCategory.update({
      where: { id },
      data: {
        jobId,
        name,
      },
    });

    res.json(updatedJobCategory);
  } catch (error) {
    console.error('Error updating job category:', error);

    // Handle specific Prisma errors
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      res.status(400).json({ message: 'Job already has a category with this name' });
      return;
    }

    // Handle other unexpected errors
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to update job category', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to update job category', error: 'Unknown error occurred' });
    }
  }
};

// Delete a job category by ID
export const deleteJobCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if the job category exists
    const existingJobCategory = await prisma.jobCategory.findUnique({
      where: { id },
    });

    if (!existingJobCategory) {
      res.status(404).json({ message: 'Job category not found' });
      return;
    }

    // Delete the job category
    await prisma.jobCategory.delete({
      where: { id },
    });

    res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error('Error deleting job category:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to delete job category', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to delete job category', error: 'Unknown error occurred' });
    }
  }
};
