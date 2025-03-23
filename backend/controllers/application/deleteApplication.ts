import { Request, Response } from 'express';
import prisma from '../../config/db';

// Delete application
export const deleteApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if the application exists
    const application = await prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    // Delete the application (soft delete)
    await prisma.application.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({ success: true, message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Failed to delete application:', error);
    res.status(500).json({ message: 'Failed to delete application' });
  }
}; 