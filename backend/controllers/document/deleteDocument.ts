import { Request, Response } from 'express';
import prisma from '../../config/db';

// Delete document
export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if the document exists
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    // Delete the document
    await prisma.document.delete({
      where: { id },
    });

    // For Firebase URLs, you might want to delete the file from Firebase Storage
    // But this would require the Firebase SDK integration

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Failed to delete document:', error);
    res.status(500).json({ message: 'Failed to delete document' });
  }
}; 