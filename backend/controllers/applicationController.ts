import { Request, Response } from 'express';
import prisma from '../config/db';

// Create a new application
export const createApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, jobId, resumeUrl, status } = req.body;

    // Validate required fields
    if (!userId || !jobId || !resumeUrl) {
      res.status(400).json({ message: 'Missing required fields: userId, jobId, or resumeUrl' });
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

    // Check if the job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    // Create the new application
    const newApplication = await prisma.application.create({
      data: {
        userId,
        jobId,
        resumeUrl,
        status: status || 'PENDING', // Default to 'PENDING' if status is not provided
      },
    });

    res.status(201).json(newApplication);
  } catch (error) {
    console.error('Error creating application:', error);

    // Handle specific Prisma errors
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      res.status(400).json({ message: 'Application already exists for this user and job' });
      return;
    }

    // Handle other unexpected errors
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to create application', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to create application', error: 'Unknown error occurred' });
    }
  }
};

// Get all applications
export const getApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const applications = await prisma.application.findMany({
      include: {
        user: true, // Include user details
        job: true,  // Include job details
      },
    });
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch applications', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch applications', error: 'Unknown error occurred' });
    }
  }
};

// Get a single application by ID
export const getApplicationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        user: true, // Include user details
        job: true,  // Include job details
      },
    });

    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    res.json(application);
  } catch (error) {
    console.error('Error fetching application:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch application', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch application', error: 'Unknown error occurred' });
    }
  }
};

// Update an application by ID
export const updateApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, jobId, resumeUrl, status } = req.body;

    // Validate required fields
    if (!userId || !jobId || !resumeUrl) {
      res.status(400).json({ message: 'Missing required fields: userId, jobId, or resumeUrl' });
      return;
    }

    // Check if the application exists
    const existingApplication = await prisma.application.findUnique({
      where: { id },
    });

    if (!existingApplication) {
      res.status(404).json({ message: 'Application not found' });
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

    // Check if the job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    // Update the application
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        userId,
        jobId,
        resumeUrl,
        status: status || existingApplication.status, // Use existing status if not provided
      },
    });

    res.json(updatedApplication);
  } catch (error) {
    console.error('Error updating application:', error);

    // Handle specific Prisma errors
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      res.status(400).json({ message: 'Application already exists for this user and job' });
      return;
    }

    // Handle other unexpected errors
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to update application', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to update application', error: 'Unknown error occurred' });
    }
  }
};

// Delete an application by ID
export const deleteApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if the application exists
    const existingApplication = await prisma.application.findUnique({
      where: { id },
    });

    if (!existingApplication) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    // Delete the application
    await prisma.application.delete({
      where: { id },
    });

    res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error('Error deleting application:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to delete application', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to delete application', error: 'Unknown error occurred' });
    }
  }
};

// Get all applications for a specific user
export const getUserApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Fetch applications for the user
    const applications = await prisma.application.findMany({
      where: { userId },
      include: {
        job: {
          include: {
            company: true,
          }
        }
      },
    });

    res.json(applications);
  } catch (error) {
    console.error('Error fetching user applications:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch user applications', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch user applications', error: 'Unknown error occurred' });
    }
  }
};