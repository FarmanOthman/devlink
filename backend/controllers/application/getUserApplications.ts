import { Request, Response } from 'express';
import prisma from '../../config/db';

// Get applications by user ID
export const getUserApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const applications = await prisma.application.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      include: {
        job: {
          include: {
            company: true,
          },
        },
      },
    });

    res.json({ success: true, data: applications });
  } catch (error) {
    console.error('Failed to fetch user applications:', error);
    res.status(500).json({ message: 'Failed to fetch user applications' });
  }
}; 