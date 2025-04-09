import { Request, Response } from 'express';
import prisma from '../../config/db';

// Get all jobs for a specific company
export const getJobsByCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;
    
    // Check if the company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });
    
    if (!company) {
      res.status(404).json({ message: 'Company not found' });
      return;
    }
    
    // Fetch jobs for the given company
    const jobs = await prisma.job.findMany({
      where: { 
        companyId,
        deletedAt: null 
      },
      include: {
        company: true,
        category: true,
        skills: {
          include: {
            skill: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching company jobs:', error);
    
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch company jobs', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch company jobs', error: 'Unknown error occurred' });
    }
  }
}; 