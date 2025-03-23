import { Request, Response } from 'express';
import prisma from '../../config/db';
import { JwtPayload } from '../../types/userTypes';

// Extend Request to include user property from auth middleware
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Get all interviews (for recruiters/admins)
export const getInterviews = async (req: Request, res: Response): Promise<void> => {
  try {
    let interviews;
    
    // If the user is a recruiter, only show interviews for their jobs
    if (req.user?.role === 'RECRUITER') {
      console.log(`Fetching interviews for recruiter: ${req.user.userId}`);
      
      // Using raw SQL query to handle non-standard field until Prisma schema is updated
      interviews = await prisma.$queryRaw`
        SELECT a.* FROM "Application" a
        JOIN "Job" j ON a."jobId" = j.id
        WHERE a."scheduledFor" IS NOT NULL
        AND a."deletedAt" IS NULL
        AND j."userId" = ${req.user.userId}
      `;
    } else {
      // For admins, fetch all interviews
      interviews = await prisma.$queryRaw`
        SELECT * FROM "Application"
        WHERE "scheduledFor" IS NOT NULL
        AND "deletedAt" IS NULL
      `;
    }

    // Fetch additional data for each interview
    const interviewsWithDetails = await Promise.all(
      (interviews as any[]).map(async (interview) => {
        const user = await prisma.user.findUnique({
          where: { id: interview.userId },
          select: {
            id: true,
            email: true,
            role: true,
          },
        });

        const job = await prisma.job.findUnique({
          where: { id: interview.jobId },
          include: {
            company: true,
          },
        });

        let recruiter = null;
        if (interview.recruiterId) {
          recruiter = await prisma.user.findUnique({
            where: { id: interview.recruiterId },
            select: {
              id: true,
              email: true,
              role: true,
            },
          });
        }

        return {
          ...interview,
          user,
          job,
          recruiter,
        };
      })
    );

    res.json({ success: true, data: interviewsWithDetails });
  } catch (error) {
    console.error('Failed to fetch interviews:', error);
    res.status(500).json({ message: 'Failed to fetch interviews' });
  }
}; 