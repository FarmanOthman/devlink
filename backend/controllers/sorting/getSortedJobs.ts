import { Response } from 'express';
import { AuthenticatedRequest } from '../../types/express';
import { SortingService, SortOption, SortParams } from '../../services/sortingService';

const sortingService = new SortingService();

export const getSortedJobs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { 
      sort_by = 'date_posted',
      order = 'desc',
      page = '1',
      limit = '10',
      ...filters 
    } = req.query;

    const userId = req.user.id;

    const jobs = await sortingService.sortJobs(
      {
        sortBy: sort_by as SortOption,
        order: order as 'asc' | 'desc',
        userId,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      },
      filters
    );

    res.json(jobs);
  } catch (error) {
    console.error('Error in getSortedJobs:', error);
    res.status(500).json({ error: 'Failed to get sorted jobs' });
  }
}; 