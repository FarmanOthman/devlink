import { Request, Response } from 'express';
import { SortingService } from '../../services/sortingService';

const sortingService = new SortingService();

export const getRecommendedJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { 
      page = '1',
      limit = '10'
    } = req.query;

    const jobs = await sortingService.getRecommendedJobs(
      userId,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json(jobs);
  } catch (error) {
    console.error('Error in getRecommendedJobs:', error);
    res.status(500).json({ error: 'Failed to get recommended jobs' });
  }
}; 