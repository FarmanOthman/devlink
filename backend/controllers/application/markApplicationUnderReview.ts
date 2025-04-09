import { Request, Response } from 'express';
import prisma from '../../config/db';
import { JwtPayload } from '../../types/userTypes';
import { createNotification } from '../../utils/notificationUtils';

/**
 * Create a notification for application under review
 * @param applicantId - The ID of the applicant
 * @param jobTitle - The title of the job
 * @param companyName - The name of the company
 * @returns True if notification was created successfully, false otherwise
 */
const notifyApplicationUnderReview = async (
  applicantId: string,
  jobTitle: string,
  companyName: string
) => {
  const message = `Your application for "${jobTitle}" at ${companyName || 'the company'} is now under review.`;
  return createNotification(applicantId, message, 'APPLICATION_UPDATE');
};

// Mark application as under review
export const markApplicationUnderReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if the application exists
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            company: true
          }
        },
        user: true
      }
    });

    if (!application) {
      res.status(404).json({ 
        success: false, 
        message: 'Application not found' 
      });
      return;
    }
    
    // Check permissions - if recruiter, only allow for their own jobs
    if (req.user?.role === 'RECRUITER' && application.job.userId !== req.user.id) {
      console.log(`Access denied: Job ${application.jobId} belongs to user ${application.job.userId}, not recruiter ${req.user.id}`);
      res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to update this application' 
      });
      return;
    }
    
    // Update the application status using SQL directly to bypass type checking
    // This is a temporary solution until the schema change is applied
    await prisma.$executeRaw`
      UPDATE "Application"
      SET status = 'UNDER_REVIEW'
      WHERE id = ${id}
    `;
    
    // Notify the applicant
    await notifyApplicationUnderReview(
      application.userId,
      application.job.title,
      application.job.company?.name || 'the company'
    );
    console.log(`Notification sent to applicant (${application.userId}) for application under review`);
    
    // Fetch the updated data
    const updatedData = await prisma.application.findUnique({
      where: { id },
      include: {
        user: true,
        job: {
          include: {
            company: true,
          },
        },
      },
    });
    
    res.json({ success: true, data: updatedData });
  } catch (error) {
    console.error('Failed to mark application as under review:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update application status' 
    });
  }
}; 