import { Request, Response } from 'express';
import prisma from '../../config/db';
import { JwtPayload } from '../../types/userTypes';
import { notifyApplicationAccepted, notifyApplicationRejected } from '../../utils/notificationUtils';

// Update application
export const updateApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, resumeUrl, coverLetter } = req.body;
    
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
      res.status(404).json({ message: 'Application not found' });
      return;
    }
    
    // For recruiters, only allow updating the status and ensure they own the job
    if (req.user?.role === 'RECRUITER') {
      // Log for debugging purposes
      console.log(`Recruiter ${req.user.id} attempting to update application ${id} for job ${application.jobId}`);
      
      // Ensure the job belongs to this recruiter (additional security check)
      if (application.job.userId !== req.user.id) {
        console.log(`Access denied: Job ${application.jobId} belongs to user ${application.job.userId}, not recruiter ${req.user.id}`);
        res.status(403).json({ message: 'You do not have permission to update this application' });
        return;
      }
      
      console.log(`Updating application ${id} status to ${status}`);
      
      // Only allow status changes (not other fields)
      const updatedApplication = await prisma.application.update({
        where: { id },
        data: { status },
        include: {
          user: true,
          job: {
            include: {
              company: true,
            },
          },
        },
      });
      
      // Send notification to applicant if application is accepted
      if (status === 'HIRED') {
        await notifyApplicationAccepted(
          application.userId,
          application.job.title,
          application.job.company?.name || 'the company'
        );
        console.log(`Notification sent to applicant (${application.userId}) for accepted application`);
      }
      
      // Send notification to applicant if application is rejected
      if (status === 'REJECTED') {
        await notifyApplicationRejected(
          application.userId,
          application.job.title,
          application.job.company?.name || 'the company'
        );
        console.log(`Notification sent to applicant (${application.userId}) for rejected application`);
      }
      
      res.json({ success: true, data: updatedApplication });
      return;
    }
    
    // For admins, allow full updates
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        resumeUrl,
        coverLetter,
        status,
      },
      include: {
        user: true,
        job: {
          include: {
            company: true,
          },
        },
      },
    });

    // Send notification to applicant if application is accepted (even if admin is updating)
    if (status === 'HIRED') {
      await notifyApplicationAccepted(
        application.userId,
        application.job.title,
        application.job.company?.name || 'the company'
      );
      console.log(`Notification sent to applicant (${application.userId}) for accepted application`);
    }
    
    // Send notification to applicant if application is rejected (even if admin is updating)
    if (status === 'REJECTED') {
      await notifyApplicationRejected(
        application.userId,
        application.job.title,
        application.job.company?.name || 'the company'
      );
      console.log(`Notification sent to applicant (${application.userId}) for rejected application`);
    }

    res.json({ success: true, data: updatedApplication });
  } catch (error) {
    console.error('Failed to update application:', error);
    res.status(500).json({ message: 'Failed to update application' });
  }
}; 