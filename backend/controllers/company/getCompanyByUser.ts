import { Request, Response } from 'express';
import prisma from '../../config/db';

// Get companies associated with a user
export const getCompanyByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Verify that the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Find companies associated with this user
    const companies = await prisma.company.findMany({
      where: {
        users: {
          some: {
            id: userId
          }
        }
      }
    });

    res.json(companies);
  } catch (error) {
    console.error('Error fetching user companies:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch user companies', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch user companies', error: 'Unknown error occurred' });
    }
  }
}; 