import { Request, Response } from 'express';
import prisma from '../../config/db';

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