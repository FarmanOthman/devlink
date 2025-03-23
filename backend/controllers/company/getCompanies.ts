import { Request, Response } from 'express';
import prisma from '../../config/db';

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