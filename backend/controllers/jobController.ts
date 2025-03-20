import { Request, Response } from 'express';
import prisma from '../config/db';

// Create a new job
export const createJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, location, type, companyId, userId } = req.body;

    // Validate required fields
    if (!title || !description || !location || !companyId || !userId) {
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

    // Create the new job
    const newJob = await prisma.job.create({
      data: {
        title,
        description,
        location,
        type,
        companyId,
        userId,
      },
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

// Get all jobs
export const getJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        company: true, // Include company details
        user: true,    // Include user details
      },
    });
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch jobs', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch jobs', error: 'Unknown error occurred' });
    }
  }
};

// Get a single job by ID
export const getJobById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        company: true, // Include company details
        user: true,    // Include user details
      },
    });

    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch job', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch job', error: 'Unknown error occurred' });
    }
  }
};

// Update a job by ID
export const updateJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, location, type, companyId, userId } = req.body;

    // Validate required fields
    if (!title || !description || !location || !companyId || !userId) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    // Check if the job exists
    const existingJob = await prisma.job.findUnique({
      where: { id },
    });

    if (!existingJob) {
      res.status(404).json({ message: 'Job not found' });
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

    // Update the job
    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        title,
        description,
        location,
        type,
        companyId,
        userId,
      },
    });

    res.json(updatedJob);
  } catch (error) {
    console.error('Error updating job:', error);

    // Handle specific Prisma errors
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      res.status(400).json({ message: 'Job with the same title already exists' });
      return;
    }

    // Handle other unexpected errors
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to update job', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to update job', error: 'Unknown error occurred' });
    }
  }
};

// Delete a job by ID
export const deleteJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if the job exists
    const existingJob = await prisma.job.findUnique({
      where: { id },
    });

    if (!existingJob) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    // Delete the job
    await prisma.job.delete({
      where: { id },
    });

    res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error('Error deleting job:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to delete job', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to delete job', error: 'Unknown error occurred' });
    }
  }
};