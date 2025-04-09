import { Request, Response } from 'express';
import prisma from '../../config/db';

// Search for jobs with filters
export const searchJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, location, type, categoryId } = req.query;
    
    // Build the where clause based on filters
    const whereClause: any = {};
    
    if (query) {
      whereClause.OR = [
        { title: { contains: query as string, mode: 'insensitive' } },
        { description: { contains: query as string, mode: 'insensitive' } }
      ];
    }
    
    if (location) {
      whereClause.location = { contains: location as string, mode: 'insensitive' };
    }
    
    if (type) {
      whereClause.type = type as string;
    }
    
    if (categoryId) {
      whereClause.categoryId = categoryId as string;
    }
    
    // Fetch jobs with filters
    const jobs = await prisma.job.findMany({
      where: whereClause,
      include: {
        company: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
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
    console.error('Error searching jobs:', error);
    
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to search jobs', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to search jobs', error: 'Unknown error occurred' });
    }
  }
}; 