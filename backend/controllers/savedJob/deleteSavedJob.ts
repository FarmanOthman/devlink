import { Request, Response } from 'express';
import prisma from '../../config/db';

// Remove a saved job for a user
export const unsaveJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if the saved job exists
    const savedJob = await prisma.savedJob.findUnique({
      where: { id }
    });

    if (!savedJob) {
      res.status(404).json({
        success: false,
        message: 'Saved job not found'
      });
      return;
    }

    // Delete the saved job
    await prisma.savedJob.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Job unsaved successfully'
    });
  } catch (error) {
    console.error('Failed to unsave job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsave job'
    });
  }
}; 