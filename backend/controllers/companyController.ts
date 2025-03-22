import { Request, Response } from 'express';
import prisma from '../config/db';

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

// Get all companies
export const getCompanies = async (req: Request, res: Response): Promise<void> => {
  try {
    const companies = await prisma.company.findMany();
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch companies', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch companies', error: 'Unknown error occurred' });
    }
  }
};

// Get a single company by ID
export const getCompanyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        jobs: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true
            // Exclude sensitive user data
          }
        }
      }
    });

    if (!company) {
      res.status(404).json({ message: 'Company not found' });
      return;
    }

    res.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch company', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch company', error: 'Unknown error occurred' });
    }
  }
};

// Get a single company by name
export const getCompanyByName = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.params;

    const company = await prisma.company.findUnique({
      where: { name },
      include: {
        jobs: true
      }
    });

    if (!company) {
      res.status(404).json({ message: 'Company not found' });
      return;
    }

    res.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch company', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch company', error: 'Unknown error occurred' });
    }
  }
};

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

// Delete a company by ID
export const deleteCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if the company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      res.status(404).json({ message: 'Company not found' });
      return;
    }

    // Delete the company
    await prisma.company.delete({
      where: { id },
    });

    res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error('Error deleting company:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to delete company', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to delete company', error: 'Unknown error occurred' });
    }
  }
};