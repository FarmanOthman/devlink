import prisma from '../config/db';

/**
 * Create a notification with standardized error handling
 * @param userId - The ID of the user receiving the notification
 * @param message - The notification message
 * @param type - The notification type
 * @returns True if notification was created successfully, false otherwise
 */
export const createNotification = async (
  userId: string,
  message: string,
  type: 'GENERAL' | 'APPLICATION_UPDATE' | 'INTERVIEW_REQUEST' | 'JOB_MATCH' | 'MESSAGE' = 'GENERAL'
): Promise<boolean> => {
  try {
    if (!userId || !message) {
      console.error('Failed to create notification: missing required fields');
      return false;
    }

    await prisma.notification.create({
      data: {
        userId,
        message,
        type,
      },
    });
    
    return true;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return false;
  }
};

/**
 * Create a notification for job application
 * @param recruiterId - The ID of the recruiter/job creator
 * @param applicantEmail - The email of the applicant
 * @param jobTitle - The title of the job
 * @returns True if notification was created successfully, false otherwise
 */
export const notifyNewApplication = async (
  recruiterId: string,
  applicantEmail: string,
  jobTitle: string
): Promise<boolean> => {
  const message = `New application received for your job "${jobTitle}" by ${applicantEmail}`;
  return createNotification(recruiterId, message, 'APPLICATION_UPDATE');
};

/**
 * Create a notification for application acceptance
 * @param applicantId - The ID of the applicant
 * @param jobTitle - The title of the job
 * @param companyName - The name of the company
 * @returns True if notification was created successfully, false otherwise
 */
export const notifyApplicationAccepted = async (
  applicantId: string,
  jobTitle: string,
  companyName: string
): Promise<boolean> => {
  const message = `Your application for "${jobTitle}" has been accepted by ${companyName || 'the company'}`;
  return createNotification(applicantId, message, 'APPLICATION_UPDATE');
};

/**
 * Create a notification for application rejection
 * @param applicantId - The ID of the applicant
 * @param jobTitle - The title of the job
 * @param companyName - The name of the company
 * @returns True if notification was created successfully, false otherwise
 */
export const notifyApplicationRejected = async (
  applicantId: string,
  jobTitle: string,
  companyName: string
): Promise<boolean> => {
  const message = `Your application for "${jobTitle}" at ${companyName || 'the company'} has been rejected.`;
  return createNotification(applicantId, message, 'APPLICATION_UPDATE');
};

/**
 * Create a notification for interview scheduling
 * @param applicantId - The ID of the applicant
 * @param jobTitle - The title of the job
 * @param companyName - The name of the company
 * @param scheduledDate - The formatted date of the interview
 * @param scheduledTime - The formatted time of the interview
 * @param interviewMessage - Optional message from the recruiter
 * @returns True if notification was created successfully, false otherwise
 */
export const notifyInterviewScheduled = async (
  applicantId: string,
  jobTitle: string,
  companyName: string,
  scheduledDate: string,
  scheduledTime: string,
  interviewMessage?: string
): Promise<boolean> => {
  const message = `Your application for "${jobTitle}" at ${companyName || 'Company'} has been scheduled for an interview on ${scheduledDate} at ${scheduledTime}. ${interviewMessage ? `Message from recruiter: ${interviewMessage}` : ''}`;
  return createNotification(applicantId, message, 'INTERVIEW_REQUEST');
};

/**
 * Create a notification for interview cancellation
 * @param userId - The ID of the user receiving the notification
 * @param jobTitle - The title of the job 
 * @param companyName - The name of the company
 * @returns True if notification was created successfully, false otherwise
 */
export const notifyInterviewCancelled = async (
  userId: string,
  jobTitle: string,
  companyName: string
): Promise<boolean> => {
  const message = `Your interview for "${jobTitle}" at ${companyName || 'Company'} has been cancelled.`;
  return createNotification(userId, message, 'INTERVIEW_REQUEST');
};

/**
 * Create a notification for interview status update
 * @param userId - The ID of the user receiving the notification
 * @param message - The notification message
 * @returns True if notification was created successfully, false otherwise
 */
export const notifyInterviewStatusUpdate = async (
  userId: string,
  message: string
): Promise<boolean> => {
  return createNotification(userId, message, 'INTERVIEW_REQUEST');
}; 