import { Request, Response } from 'express';
import prisma from '../../config/db';

// Save a job for a user
export const saveJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.body;
    const userId = req.user?.id;

    // Validate required fields
    if (!jobId) {
      res.status(400).json({
        success: false,
        message: 'Missing required field: jobId'
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Check if the job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Job not found'
      });
      return;
    }

    // Check if the job is already saved by the user
    const existingSavedJob = await prisma.savedJob.findFirst({
      where: {
        userId,
        jobId
      }
    });

    if (existingSavedJob) {
      res.status(400).json({
        success: false,
        message: 'Job already saved'
      });
      return;
    }

    // Create the saved job
    const savedJob = await prisma.savedJob.create({
      data: {
        userId,
        jobId
      }
    });

    res.status(201).json({
      success: true,
      data: savedJob
    });
  } catch (error) {
    console.error('Failed to save job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save job'
    });
  }
}; 