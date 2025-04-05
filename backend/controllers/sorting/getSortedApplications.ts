import { Request, Response } from 'express';
import { SortingService, SortOption, SortOrder } from '../../services/sortingService';

const sortingService = new SortingService();

export const getSortedApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      sort_by = 'date_posted',
      order = 'desc',
      page = '1',
      limit = '10'
    } = req.query;
    const { jobId } = req.params;

    const applications = await sortingService.sortApplications({
      sortBy: sort_by as SortOption,
      order: order as SortOrder,
      jobId,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    res.json(applications);
  } catch (error) {
    console.error('Error in getSortedApplications:', error);
    res.status(500).json({ error: 'Failed to get sorted applications' });
  }
}; 