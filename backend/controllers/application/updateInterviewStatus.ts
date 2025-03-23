import { Request, Response } from 'express';
import prisma from '../../config/db';
import { InterviewStatus } from '@prisma/client';
import { notifyInterviewStatusUpdate, notifyInterviewCancelled } from '../../utils/notificationUtils';

// Update interview status
export const updateInterviewStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { interviewStatus } = req.body;

    // Validate required fields
    if (!interviewStatus) {
      res.status(400).json({ message: 'Missing required fields: interviewStatus' });
      return;
    }

    // Check if the application exists
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        user: true,
        job: {
          include: {
            company: true
          }
        }
      }
    });

    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    // Update the interview status
    const updatedApplication = await prisma.$executeRaw`
      UPDATE "Application"
      SET "interviewStatus" = ${interviewStatus}::text
      WHERE id = ${id}
    `;

    // Get the full application data with raw query to access recruiterId
    const fullApplicationData = await prisma.$queryRaw`
      SELECT * FROM "Application" WHERE id = ${id}
    `;
    
    const applicationData = (fullApplicationData as any[])[0];

    // Create appropriate notification messages based on status
    let applicantMessage = '';
    let recruiterMessage = '';

    switch (interviewStatus) {
      case InterviewStatus.ACCEPTED:
        applicantMessage = `You have accepted the interview for "${application.job.title}" at ${application.job.company?.name || 'Company'}. Please ensure you're available at the scheduled time.`;
        recruiterMessage = `${application.user?.email || 'The applicant'} has accepted the interview for "${application.job.title}".`;
        break;
      case InterviewStatus.DECLINED:
        applicantMessage = `You have declined the interview for "${application.job.title}" at ${application.job.company?.name || 'Company'}.`;
        recruiterMessage = `${application.user?.email || 'The applicant'} has declined the interview for "${application.job.title}".`;
        break;
      case InterviewStatus.COMPLETED:
        applicantMessage = `Your interview for "${application.job.title}" at ${application.job.company?.name || 'Company'} has been marked as completed. You will receive further updates on your application status.`;
        break;
      case InterviewStatus.CANCELED:
        // Use dedicated function for cancellation notifications
        await notifyInterviewCancelled(
          application.userId, 
          application.job.title, 
          application.job.company?.name || 'Company'
        );
        
        // If there's a recruiter assigned, notify them too
        if (applicationData?.recruiterId) {
          await notifyInterviewCancelled(
            applicationData.recruiterId,
            application.job.title,
            application.job.company?.name || 'Company'
          );
        }
        
        console.log(`Interview cancellation notifications sent for application ${id}`);
        break;
      default:
        applicantMessage = `Your interview status for "${application.job.title}" has been updated to ${interviewStatus.toLowerCase()}.`;
        recruiterMessage = `Interview status for application to "${application.job.title}" has been updated to ${interviewStatus.toLowerCase()}.`;
    }

    // Notify the applicant (except for CANCELED which is handled above)
    if (applicantMessage && interviewStatus !== InterviewStatus.CANCELED) {
      await notifyInterviewStatusUpdate(application.userId, applicantMessage);
      console.log(`Interview status notification sent to applicant ${application.userId}`);
    }
    
    // Notify the recruiter if present and if there's a message (except for CANCELED which is handled above)
    if (applicationData?.recruiterId && recruiterMessage && interviewStatus !== InterviewStatus.CANCELED) {
      await notifyInterviewStatusUpdate(applicationData.recruiterId, recruiterMessage);
      console.log(`Interview status notification sent to recruiter ${applicationData.recruiterId}`);
    }

    const updatedData = await prisma.application.findUnique({
      where: { id },
      include: {
        user: true,
        job: {
          include: {
            company: true
          }
        }
      }
    });

    res.json({ success: true, data: updatedData });
  } catch (error) {
    console.error('Failed to update interview status:', error);
    res.status(500).json({ message: 'Failed to update interview status' });
  }
}; 