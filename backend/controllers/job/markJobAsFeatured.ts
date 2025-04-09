import { Request, Response } from 'express';
import prisma from '../../config/db';

// Mark a job as featured by incrementing its view count
export const markJobAsFeatured = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { increment = 50 } = req.body; // Default to increasing view count by 50
    
    // Check if the job exists
    const job = await prisma.job.findUnique({
      where: { id },
    });
    
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    
    // Promote the job by increasing its view count
    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        viewCount: job.viewCount + (typeof increment === 'number' ? increment : 50),
      },
    });
    
    res.json({
      message: 'Job has been featured successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('Error featuring job:', error);
    
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to feature job', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to feature job', error: 'Unknown error occurred' });
    }
  }
}; 