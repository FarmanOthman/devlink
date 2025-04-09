import { Request, Response } from 'express';
import prisma from '../../config/db';

// Get document by ID
export const getDocumentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
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
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    res.json({ success: true, data: document });
  } catch (error) {
    console.error('Failed to fetch document:', error);
    res.status(500).json({ message: 'Failed to fetch document' });
  }
}; 