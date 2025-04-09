import { Request, Response } from 'express';
import prisma from '../../config/db';
import { ApplicationStatus, InterviewStatus } from '@prisma/client';
import { notifyInterviewScheduled } from '../../utils/notificationUtils';

// Schedule interview for an application
export const scheduleInterview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { scheduledFor, interviewMessage, recruiterId } = req.body;

    // Validate required fields
    if (!scheduledFor || !recruiterId) {
      res.status(400).json({ message: 'Missing required fields: scheduledFor or recruiterId' });
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

    // Check if the recruiter exists
    const recruiter = await prisma.user.findUnique({
      where: { id: recruiterId },
    });

    if (!recruiter) {
      res.status(404).json({ message: 'Recruiter not found' });
      return;
    }

    // Format the interview date for display
    const interviewDate = new Date(scheduledFor);
    const formattedDate = interviewDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = interviewDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Update the application with interview details
    const updatedApplication = await prisma.$executeRaw`
      UPDATE "Application"
      SET status = ${ApplicationStatus.INTERVIEW_SCHEDULED},
          "scheduledFor" = ${scheduledFor}::timestamp,
          "interviewMessage" = ${interviewMessage},
          "interviewStatus" = ${InterviewStatus.PENDING}::text,
          "recruiterId" = ${recruiterId}
      WHERE id = ${id}
    `;

    // Create a notification for the applicant
    await notifyInterviewScheduled(
      application.userId,
      application.job.title,
      application.job.company?.name || 'Company',
      formattedDate,
      formattedTime,
      interviewMessage
    );
    console.log(`Interview notification sent to user ${application.userId} for job ${application.jobId}`);

    const updatedData = await prisma.application.findUnique({
      where: { id },
      include: {
        user: true,
        job: {
          include: {
            company: true,
          }
        }
      }
    });

    res.json({ success: true, data: updatedData });
  } catch (error) {
    console.error('Failed to schedule interview:', error);
    res.status(500).json({ message: 'Failed to schedule interview' });
  }
}; 