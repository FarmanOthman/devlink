import { Request, Response } from 'express';
import prisma from '../../config/db';

// Check if a job is saved by the current user
export const isJobSaved = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;

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

    // Check if the job is saved by the user
    const savedJob = await prisma.savedJob.findFirst({
      where: {
        userId,
        jobId
      }
    });

    res.json({
      success: true,
      isSaved: !!savedJob,
      savedJobId: savedJob?.id || null
    });
  } catch (error) {
    console.error('Failed to check saved job status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check saved job status'
    });
  }
}; 