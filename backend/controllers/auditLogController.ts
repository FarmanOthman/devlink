import { Request, Response } from 'express';
import prisma from '../config/db';

// Create a new audit log entry
export const createAuditLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, action, oldValue, newValue } = req.body;

    // Validate required fields
    if (!userId || !action) {
      res.status(400).json({ message: 'Missing required fields: userId or action' });
      return;
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Create the new audit log entry
    const newAuditLog = await prisma.auditLog.create({
      data: {
        userId,
        action,
        oldValue,
        newValue,
      },
    });

    res.status(201).json(newAuditLog);
  } catch (error) {
    console.error('Error creating audit log:', error);

    // Handle Prisma errors
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      res.status(400).json({ message: 'Audit log creation failed due to unique constraint violation' });
      return;
    }

    // Handle other unexpected errors
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to create audit log', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to create audit log', error: 'Unknown error occurred' });
    }
  }
};

// Get all audit logs for a user
export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Fetch audit logs for the given user
    const auditLogs = await prisma.auditLog.findMany({
      where: { userId },
      include: {
        user: true, // Include user details
      },
      orderBy: {
        createdAt: 'desc', // Sort audit logs by the most recent first
      },
    });

    if (auditLogs.length === 0) {
      res.status(404).json({ message: 'No audit logs found for this user' });
      return;
    }

    res.json(auditLogs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch audit logs', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch audit logs', error: 'Unknown error occurred' });
    }
  }
};

// Get a single audit log by ID
export const getAuditLogById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const auditLog = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: true, // Include user details
      },
    });

    if (!auditLog) {
      res.status(404).json({ message: 'Audit log not found' });
      return;
    }

    res.json(auditLog);
  } catch (error) {
    console.error('Error fetching audit log:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to fetch audit log', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch audit log', error: 'Unknown error occurred' });
    }
  }
};

// Delete an audit log by ID
export const deleteAuditLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if the audit log exists
    const auditLog = await prisma.auditLog.findUnique({
      where: { id },
    });

    if (!auditLog) {
      res.status(404).json({ message: 'Audit log not found' });
      return;
    }

    // Delete the audit log from the database
    await prisma.auditLog.delete({
      where: { id },
    });

    res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error('Error deleting audit log:', error);

    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to delete audit log', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to delete audit log', error: 'Unknown error occurred' });
    }
  }
};
