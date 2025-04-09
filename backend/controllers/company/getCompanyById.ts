import { Request, Response } from 'express';
import prisma from '../../config/db';

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