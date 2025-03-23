import { Request, Response } from 'express';
import prisma from '../../config/db';

/**
 * Delete a job by ID
 */
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