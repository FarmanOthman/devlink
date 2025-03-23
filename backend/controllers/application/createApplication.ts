import { Request, Response } from 'express';
import prisma from '../../config/db';
import { JwtPayload } from '../../types/userTypes';
import { notifyNewApplication } from '../../utils/notificationUtils';

// Extend Request to include user property from auth middleware
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Create a new application
export const createApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, jobId, resumeUrl, coverLetter, status } = req.body;

    // Validate required fields
    if (!userId || !jobId || !resumeUrl) {
      res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: userId, jobId, or resumeUrl' 
      });
      return;
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
      return;
    }

    // Check if the job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: true,
      }
    });

    if (!job) {
      res.status(404).json({ 
        success: false, 
        message: 'Job not found' 
      });
      return;
    }
    
    // Check if the job has expired
    if (job.expiresAt && new Date(job.expiresAt) < new Date()) {
      res.status(400).json({ 
        success: false, 
        message: 'This job posting has expired and is no longer accepting applications' 
      });
      return;
    }

    // Check if the user already applied for this job
    const existingApplication = await prisma.application.findFirst({
      where: {
        userId,
        jobId,
        deletedAt: null,
      },
    });

    if (existingApplication) {
      res.status(400).json({ 
        success: false, 
        message: 'You have already applied for this job. You cannot submit multiple applications for the same position.' 
      });
      return;
    }

    // Create the new application
    const newApplication = await prisma.application.create({
      data: {
        userId,
        jobId,
        resumeUrl,
        coverLetter,
        status: status || 'PENDING',
      },
    });

    // Send notification to the job creator
    await notifyNewApplication(job.userId, user.email, job.title);
    console.log(`Notification sent to job creator (${job.userId}) for new application`);

    res.status(201).json({ success: true, data: newApplication });
  } catch (error) {
    console.error('Failed to create application:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create application due to a server error.' 
    });
  }
}; 