import { Request, Response } from 'express';
import prisma from '../../config/db';

/**
 * Delete a user skill by ID
 */
export const deleteUserSkill = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if the user skill exists
    const existingUserSkill = await prisma.userSkill.findUnique({
      where: { id },
    });

    if (!existingUserSkill) {
      res.status(404).json({ message: 'User skill not found' });
      return;
    }

    // Delete the user skill
    await prisma.userSkill.delete({
      where: { id },
    });

    res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error('Error deleting user skill:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to delete user skill', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to delete user skill', error: 'Unknown error occurred' });
    }
  }
}; 