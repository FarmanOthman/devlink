import { Request, Response } from 'express';
import { SortingService } from '../../services/sortingService';

const sortingService = new SortingService();

export const getRecommendedCandidates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const { 
      page = '1',
      limit = '10'
    } = req.query;

    const candidates = await sortingService.getRecommendedCandidates(
      jobId,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json(candidates);
  } catch (error) {
    console.error('Error in getRecommendedCandidates:', error);
    res.status(500).json({ error: 'Failed to get recommended candidates' });
  }
}; 