import { Request, Response } from 'express';
import prisma from '../config/db';
import fs from 'fs';
import path from 'path';

// Create a new document
export const createDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, fileName, fileType, filePath } = req.body;

    // Validate required fields
    if (!userId || !fileName || !fileType || !filePath) {
      res.status(400).json({ message: 'Missing required fields: userId, fileName, fileType, or filePath' });
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

    // Create the new document
    const newDocument = await prisma.document.create({
      data: {
        userId,
        fileName,
        fileType,
        filePath,
      },
    });

    res.status(201).json(newDocument);
  } catch (error) {
    console.error('Error creating document:', error);

    // Handle Prisma errors
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      res.status(400).json({ message: 'A document with this file name already exists' });
      return;
    }

    // Handle other unexpected errors
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to create document', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to create document', error: 'Unknown error occurred' });
    }
  }
};

// Get all documents for a user
export const getDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Fetch documents for the given user
    const documents = await prisma.document.findMany({
      where: { userId },
      include: {
        user: true, // Include user details
      },
    });

    if (documents.length === 0) {
      res.status(404).json({ message: 'No documents found for this user' });
      return;
    }

    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch documents', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch documents', error: 'Unknown error occurred' });
    }
  }
};

// Get a single document by ID
export const getDocumentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        user: true, // Include user details
      },
    });

    if (!document) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch document', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch document', error: 'Unknown error occurred' });
    }
  }
};

// Update a document's information by ID
export const updateDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, fileName, fileType, filePath } = req.body;

    // Validate required fields
    if (!userId || !fileName || !fileType || !filePath) {
      res.status(400).json({ message: 'Missing required fields: userId, fileName, fileType, or filePath' });
      return;
    }

    // Check if the document exists
    const existingDocument = await prisma.document.findUnique({
      where: { id },
    });

    if (!existingDocument) {
      res.status(404).json({ message: 'Document not found' });
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

    // Update the document
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        userId,
        fileName,
        fileType,
        filePath,
      },
    });

    res.json(updatedDocument);
  } catch (error) {
    console.error('Error updating document:', error);

    // Handle Prisma errors
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      res.status(400).json({ message: 'A document with this file name already exists' });
      return;
    }

    // Handle other unexpected errors
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to update document', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to update document', error: 'Unknown error occurred' });
    }
  }
};

// Delete a document by ID
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

    // Delete the document from the database
    await prisma.document.delete({
      where: { id },
    });

    // Optionally, delete the file from the file system
    const filePath = document.filePath;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // Deletes the file from the file system
    }

    res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error('Error deleting document:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to delete document', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to delete document', error: 'Unknown error occurred' });
    }
  }
};
