import { Request, Response } from 'express';
import prisma from '../../config/db';

// Get a specific saved job by ID
export const getSavedJobById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const savedJob = await prisma.savedJob.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            company: true,
            category: true,
            skills: {
              include: {
                skill: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!savedJob) {
      res.status(404).json({
        success: false,
        message: 'Saved job not found'
      });
      return;
    }

    res.json({
      success: true,
      data: savedJob
    });
  } catch (error) {
    console.error('Failed to fetch saved job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch saved job'
    });
  }
}; 