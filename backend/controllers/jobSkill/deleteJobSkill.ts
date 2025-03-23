import { Request, Response } from 'express';
import prisma from '../../config/db';

/**
 * Delete a job skill by ID
 */
export const deleteJobSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if the job skill exists
    const existingJobSkill = await prisma.jobSkill.findUnique({
      where: { id },
    });

    if (!existingJobSkill) {
      res.status(404).json({ message: 'Job skill not found' });
      return;
    }

    // Delete the job skill
    await prisma.jobSkill.delete({
      where: { id },
    });

    res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error('Error deleting job skill:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to delete job skill', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to delete job skill', error: 'Unknown error occurred' });
    }
  }
}; 