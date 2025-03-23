import { Request, Response } from 'express';
import prisma from '../../config/db';

// Get all documents (admin only)
export const getDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const documents = await prisma.document.findMany({
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

    res.json({ success: true, data: documents });
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
}; 