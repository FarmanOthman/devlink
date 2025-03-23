import { Request, Response } from 'express';
import prisma from '../../config/db';

// Create a new company
export const createCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, website, logo, description, industry, size, founded, location } = req.body;

    // Validate required fields
    if (!name) {
      res.status(400).json({ message: 'Name is required' });
      return;
    }

    // Check if the company name already exists
    const existingCompany = await prisma.company.findUnique({
      where: { name },
    });

    if (existingCompany) {
      res.status(400).json({ message: 'Company name already exists' });
      return;
    }

    // Create the new company
    const newCompany = await prisma.company.create({
      data: {
        name,
        website,
        logo,
        description,
        industry,
        size,
        founded: founded ? Number(founded) : undefined,
        location,
      },
    });

    res.status(201).json(newCompany);
  } catch (error) {
    console.error('Error creating company:', error);

    // Handle specific Prisma errors
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      res.status(400).json({ message: 'Company name already exists' });
      return;
    }

    // Handle other unexpected errors
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to create company', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to create company', error: 'Unknown error occurred' });
    }
  }
}; 