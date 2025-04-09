import { Request, Response } from 'express';
import prisma from '../../config/db';

/**
 * Create a new document or update an existing one
 * If the user already has a document, it will be updated
 * Otherwise, a new document will be created
 */
export const createOrUpdateDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, fileUrl, documentType = 'RESUME' } = req.body;

    // Validate required fields
    if (!userId || !fileUrl) {
      res.status(400).json({ message: 'Missing required fields: userId or fileUrl' });
      return;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if the user already has a document
    const existingDocument = await prisma.document.findUnique({
      where: { userId }
    });

    let document;

    if (existingDocument) {
      // Update existing document
      document = await prisma.document.update({
        where: { userId },
        data: {
          fileUrl,
          documentType,
        }
      });
      
      res.json({
        message: 'Document updated successfully',
        document
      });
    } else {
      // Create new document
      document = await prisma.document.create({
        data: {
          userId,
          fileUrl,
          documentType,
        }
      });
      
      res.status(201).json({
        message: 'Document created successfully',
        document
      });
    }
  } catch (error) {
    console.error('Error creating/updating document:', error);
    
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to create/update document', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to create/update document', error: 'Unknown error occurred' });
    }
  }
}; 