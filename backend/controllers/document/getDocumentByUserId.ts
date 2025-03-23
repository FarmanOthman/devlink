import { Request, Response } from 'express';
import prisma from '../../config/db';

// Get document by userId
export const getDocumentByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Fetch document for the user
    const document = await prisma.document.findFirst({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      res.status(404).json({ message: 'No document found for this user' });
      return;
    }

    res.json({ success: true, document });
  } catch (error) {
    console.error('Failed to get document by user ID:', error);
    res.status(500).json({ message: 'Failed to get document' });
  }
}; 