import { Request, Response } from 'express';
import prisma from '../../config/db';
import { DocumentType } from '@prisma/client';

// Create or update a user document
export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, fileUrl, documentType } = req.body;

    // Validate required fields
    if (!userId || !fileUrl) {
      res.status(400).json({ message: 'Missing required fields: userId or fileUrl' });
      return;
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if the user already has a document
    const existingDocument = await prisma.document.findFirst({
      where: { userId },
    });

    let document;

    if (existingDocument) {
      // Update existing document using raw query to bypass schema issues
      await prisma.$executeRaw`
        UPDATE "Document"
        SET "fileUrl" = ${fileUrl},
            "documentType" = ${documentType || 'RESUME'}::text,
            "updatedAt" = NOW()
        WHERE "userId" = ${userId}
      `;
      
      // Fetch the updated document
      document = await prisma.document.findFirst({
        where: { userId }
      });
    } else {
      // Create new document using raw query to bypass schema issues
      await prisma.$executeRaw`
        INSERT INTO "Document" ("id", "userId", "fileUrl", "documentType", "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid(), 
          ${userId}, 
          ${fileUrl}, 
          ${documentType || 'RESUME'}::text, 
          NOW(), 
          NOW()
        )
      `;
      
      // Fetch the created document
      document = await prisma.document.findFirst({
        where: { userId }
      });
    }

    res.status(201).json({ success: true, data: document });
  } catch (error) {
    console.error('Failed to create/update document:', error);
    res.status(500).json({ message: 'Failed to create/update document' });
  }
}; 