import { Request, Response } from 'express';
import prisma from '../../config/db';

// Update a company by ID
export const updateCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, website, logo, description, industry, size, founded, location } = req.body;

    // Validate required fields
    if (!name) {
      res.status(400).json({ message: 'Name is required' });
      return;
    }

    // Check if the company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      res.status(404).json({ message: 'Company not found' });
      return;
    }

    // Check if the new name already exists for a different company
    if (name !== existingCompany.name) {
      const companyWithSameName = await prisma.company.findUnique({
        where: { name },
      });

      if (companyWithSameName && companyWithSameName.id !== id) {
        res.status(400).json({ message: 'Company name already exists' });
        return;
      }
    }

    // Update the company
    const updatedCompany = await prisma.company.update({
      where: { id },
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

    res.json(updatedCompany);
  } catch (error) {
    console.error('Error updating company:', error);

    // Handle specific Prisma errors
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      res.status(400).json({ message: 'Company name already exists' });
      return;
    }

    // Handle other unexpected errors
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to update company', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to update company', error: 'Unknown error occurred' });
    }
  }
}; 