import { Request, Response } from 'express';
import prisma from '../../config/db';

// Get application by ID
export const getApplicationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        user: true,
        job: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    res.json({ success: true, data: application });
  } catch (error) {
    console.error('Failed to fetch application:', error);
    res.status(500).json({ message: 'Failed to fetch application' });
  }
}; 