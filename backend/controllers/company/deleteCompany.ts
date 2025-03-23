import { Request, Response } from 'express';
import prisma from '../../config/db';

// Delete a company by ID
export const deleteCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if the company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      res.status(404).json({ message: 'Company not found' });
      return;
    }

    // Delete the company
    await prisma.company.delete({
      where: { id },
    });

    res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error('Error deleting company:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to delete company', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to delete company', error: 'Unknown error occurred' });
    }
  }
}; 