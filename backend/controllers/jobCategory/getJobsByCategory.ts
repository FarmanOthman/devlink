import { Request, Response } from 'express';
import prisma from '../../config/db';

/**
 * Get jobs by category ID
 */
export const getJobsByCategoryId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { limit = 20, page = 1 } = req.query;

    // Check if the category exists
    const category = await prisma.jobCategory.findUnique({
      where: { id }
    });

    if (!category) {
      res.status(404).json({ message: 'Job category not found' });
      return;
    }

    // Calculate pagination
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    // Get total count for pagination
    const totalCount = await prisma.job.count({ 
      where: { 
        categoryId: id,
        deletedAt: null
      } 
    });

    // Get jobs for this category
    const jobs = await prisma.job.findMany({
      where: {
        categoryId: id,
        deletedAt: null
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            industry: true,
            location: true
          }
        },
        skills: {
          include: {
            skill: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: parseInt(limit as string)
    });

    res.json({
      category,
      jobs,
      pagination: {
        total: totalCount,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(totalCount / parseInt(limit as string))
      }
    });

  } catch (error) {
    console.error('Error fetching jobs by category:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch jobs by category', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch jobs by category', error: 'Unknown error occurred' });
    }
  }
}; 