import { Request, Response } from 'express';
import prisma from '../../config/db';

// Update document
export const updateDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { fileUrl, documentType } = req.body;

    // Check if the document exists
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    // Update the document using raw query to bypass schema issues
    await prisma.$executeRaw`
      UPDATE "Document"
      SET "fileUrl" = ${fileUrl},
          "documentType" = ${documentType || document.documentType}::text,
          "updatedAt" = NOW()
      WHERE "id" = ${id}
    `;
    
    // Fetch the updated document
    const updatedDocument = await prisma.document.findUnique({
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

    res.json({ success: true, data: updatedDocument });
  } catch (error) {
    console.error('Failed to update document:', error);
    res.status(500).json({ message: 'Failed to update document' });
  }
}; 